import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import Busboy from 'busboy';

import { PrismaClient } from '@prisma/client';
import { checkExpiringTools } from './emailService.js';
import { uploadFile, deleteFile, getObjectSignedUrl, listAllObjects } from './s3.js';


const app = express();
const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const toBoolean = (value) => value === true || value === 'true';
const asNumber = (value) => Number(value);
const generateUniqueFileName = (originalName) => `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(originalName)}`;

// Parser simples de multipart usando Busboy para obter 1 arquivo + campos
const parseMultipart = (req) => new Promise((resolve, reject) => {
  const busboy = Busboy({ headers: req.headers, limits: { files: 1 } });
  const fields = {};
  let fileData = null;

  busboy.on('file', (_name, file, info) => {
    const { filename, mimeType } = info;
    const chunks = [];
    let size = 0;

    file.on('data', (data) => {
      chunks.push(data);
      size += data.length;
    });

    file.on('end', () => {
      fileData = {
        buffer: Buffer.concat(chunks),
        originalname: filename,
        mimetype: mimeType,
        size
      };
    });
  });

  busboy.on('field', (name, val) => {
    if (Object.prototype.hasOwnProperty.call(fields, name)) {
      if (Array.isArray(fields[name])) {
        fields[name].push(val);
      } else {
        fields[name] = [fields[name], val];
      }
    } else {
      fields[name] = val;
    }
  });

  busboy.on('error', (err) => reject(err));
  busboy.on('finish', () => {
    if (!fileData) {
      return reject(new Error('Nenhum arquivo enviado'));
    }
    resolve({ file: fileData, fields });
  });

  req.pipe(busboy);
});

const secretKey = process.env.JWT_SECRET_KEY;
const PORT = process.env.PORT || 8080;

// Middleware para permitir CORS
app.use(cors(corsOptions));

// Middleware para interpretar o corpo das requisições como JSON
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.setHeader('X-App-Version', '2025.11.27');
  next();
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.post('/upload', async (req, res) => {
  try {
    const { file } = await parseMultipart(req);

    const storedName = generateUniqueFileName(file.originalname);
    await uploadFile(file.buffer, storedName, file.mimetype);
    const signedUrl = await getObjectSignedUrl(storedName);

    res.json({
      message: 'Upload concluido com sucesso',
      file: {
        originalName: file.originalname,
        storedAs: storedName,
        size: file.size,
        url: signedUrl
      }
    });
  } catch (error) {
    console.error('Erro ao enviar para o S3:', error);
    const isNoFile = error.message === 'Nenhum arquivo enviado';
    const message = isNoFile ? error.message : 'Falha ao enviar para o S3';
    res.status(isNoFile ? 400 : 500).json({ error: message });
  }
});


// Verificação de autenticação
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Remover o prefixo "Bearer " se estiver presente
  const tokenWithoutBearer = token.split(' ')[1]; // O token real fica após o espaço

  if (!tokenWithoutBearer) {
    return res.status(401).json({ error: 'Token format is incorrect' });
  }

  jwt.verify(tokenWithoutBearer, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = decoded.id; // Coloca o ID do usuário no objeto `req`
    req.userRole = decoded.role; // Adiciona o papel do usuário no objeto `req`
    next(); // Chama o próximo middleware ou a função de rota
  });
};

// Middleware para verificar se o usuário é admin
const isAdmin = (req, res, next) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// Middleware para verificar permissões de acesso a um post
const checkPostAccess = async (req, res, next) => {
  try {
    const postId = asNumber(req.params.id);
    const userId = req.userId;
    const userRole = req.userRole;
    
    // Admins têm acesso total
    if (userRole === 'ADMIN') {
      return next();
    }
    
    const post = await prisma.posts.findUnique({
      where: { id: postId },
      include: {
        sharedWith: {
          where: { userId: userId }
        }
      }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Verificar se o usuário é o proprietário
    if (post.ownerId === userId) {
      return next();
    }
    
    // Verificar se o post é público
    if (post.isPublic) {
      // Para posts públicos, permitir apenas visualização para não-proprietários
      if (req.method === 'GET') {
        return next();
      } else {
        return res.status(403).json({ error: 'Forbidden: You can only view public posts' });
      }
    }
    
    // Verificar se o usuário tem acesso compartilhado
    if (post.sharedWith && post.sharedWith.length > 0) {
      const access = post.sharedWith[0];
      
      // Verificar o tipo de acesso com base no método HTTP
      if (req.method === 'GET' && access.canView) {
        return next();
      } else if ((req.method === 'PUT' || req.method === 'PATCH') && access.canEdit) {
        return next();
      } else if (req.method === 'DELETE' && access.canDelete) {
        return next();
      }
    }
    
    return res.status(403).json({ error: 'Forbidden: You do not have permission to access this resource' });
  } catch (error) {
    console.error('Error checking post access:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware para verificar permissões de acesso a um treinamento
const checkTrainingAccess = async (req, res, next) => {
  try {
    const trainingId = asNumber(req.params.id);
    const userId = req.userId;
    const userRole = req.userRole;
    
    // Admins têm acesso total
    if (userRole === 'ADMIN') {
      return next();
    }
    
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        sharedWith: {
          where: { userId: userId }
        }
      }
    });
    
    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }
    
    // Verificar se o usuário é o proprietário
    if (training.ownerId === userId) {
      return next();
    }
    
    // Verificar se o treinamento é público
    if (training.isPublic) {
      // Para treinamentos públicos, permitir apenas visualização para não-proprietários
      if (req.method === 'GET') {
        return next();
      } else {
        return res.status(403).json({ error: 'Forbidden: You can only view public trainings' });
      }
    }
    
    // Verificar se o usuário tem acesso compartilhado
    if (training.sharedWith && training.sharedWith.length > 0) {
      const access = training.sharedWith[0];
      
      // Verificar o tipo de acesso com base no método HTTP
      if (req.method === 'GET' && access.canView) {
        return next();
      } else if ((req.method === 'PUT' || req.method === 'PATCH') && access.canEdit) {
        return next();
      } else if (req.method === 'DELETE' && access.canDelete) {
        return next();
      }
    }
    
    return res.status(403).json({ error: 'Forbidden: You do not have permission to access this resource' });
  } catch (error) {
    console.error('Error checking training access:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Rota para obter os posts
app.get("/api/posts", authenticateToken, async (req, res) => {
  try {
    const { categoryId } = req.query;
    const userId = req.userId;
    const userRole = req.userRole;
    const parsedCategoryId = categoryId ? asNumber(categoryId) : undefined;

    let filter = categoryId ? { where: { categoryId: parsedCategoryId } } : {};
    
    // Se não for admin, filtrar apenas posts públicos ou com acesso
    if (userRole !== 'ADMIN') {
      filter = {
        where: {
          AND: [
            categoryId ? { categoryId: parsedCategoryId } : {},
            {
              OR: [
                { isPublic: true },
                { ownerId: userId },
                {
                  sharedWith: {
                    some: {
                      userId: userId,
                      canView: true
                    }
                  }
                }
              ]
            }
          ]
        }
      };
    }

    const posts = await prisma.posts.findMany({
      ...filter,
      orderBy: [{ created: 'desc' }],
      include: {
        category: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    await Promise.all(posts.map(async (post) => {
      if (post.imageName) {
        post.imageUrl = await getObjectSignedUrl(post.imageName);
      }
    }));

    res.send(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).send({ error: 'Unable to fetch posts' });
  }
});

// Rota para criar posts (exige autenticação)
app.post('/api/posts', authenticateToken, async (req, res) => {
  try {
    const { file, fields } = await parseMultipart(req);
    const caption = fields.caption;
    const categoryId = fields.categoryId;
    const isPublic = toBoolean(fields.isPublic);
    const userId = req.userId;

    if (!categoryId) {
      return res.status(400).json({ error: 'categoryId é obrigatório' });
    }

    const parsedCategoryId = Number(categoryId);
    if (Number.isNaN(parsedCategoryId)) {
      return res.status(400).json({ error: 'categoryId inválido' });
    }

    const storedName = generateUniqueFileName(file.originalname);
    await uploadFile(file.buffer, storedName, file.mimetype);

    const post = await prisma.posts.create({
      data: {
        imageName: storedName,
        originalFileName: file.originalname,
        fileType: file.mimetype,
        caption,
        categoryId: parsedCategoryId,
        ownerId: userId,
        isPublic
      }
    });
  
    res.status(201).send(post);
  } catch (error) {
    console.error('Upload error:', error);
    const isNoFile = error.message === 'Nenhum arquivo enviado';
    const message = isNoFile ? 'No file uploaded' : 'File upload failed';
    res.status(isNoFile ? 400 : 500).json({ error: message, details: error.message });
  }
});

// Rota para obter a imagem/download de um post
app.get("/api/posts/:id/download", authenticateToken, checkPostAccess, async (req, res) => {
  try {
    const id = asNumber(req.params.id);
    const post = await prisma.posts.findUnique({ where: { id } });

    if (!post) {
      return res.status(404).json({ error: "File not found" });
    }

    const url = await getObjectSignedUrl(post.imageName);
    return res.json({ 
      url,
      originalFileName: post.originalFileName,
      fileType: post.fileType 
    });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Error downloading file" });
  }
});

// Rota para deletar posts (exige autenticação e verificação de acesso)
app.delete("/api/posts/:id", authenticateToken, checkPostAccess, async (req, res) => {
  const id = asNumber(req.params.id);
  
  try {
    const post = await prisma.posts.findUnique({ where: { id } });
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Excluir compartilhamentos associados
    await prisma.sharedAccess.deleteMany({
      where: { postId: id }
    });
    
    // Excluir o arquivo no S3
    try {
      await deleteFile(post.imageName);
    } catch (err) {
      console.warn('Falha ao remover arquivo do S3:', err.message);
    }
    
    // Excluir o post
    await prisma.posts.delete({ where: { id } });
    
    res.send(post);
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Error deleting post" });
  }
});

// Rota para atualizar a visibilidade de um post
app.patch("/api/posts/:id/visibility", authenticateToken, checkPostAccess, async (req, res) => {
  try {
    const id = asNumber(req.params.id);
    const { isPublic } = req.body;
    
    if (isPublic === undefined) {
      return res.status(400).json({ error: "isPublic field is required" });
    }
    
    const post = await prisma.posts.update({
      where: { id },
      data: { isPublic: Boolean(isPublic) }
    });
    
    res.json(post);
  } catch (error) {
    console.error("Update visibility error:", error);
    res.status(500).json({ error: "Error updating post visibility" });
  }
});

// Rota para compartilhar um post com outro usuário
app.post("/api/posts/:id/share", authenticateToken, checkPostAccess, async (req, res) => {
  try {
    const postId = asNumber(req.params.id);
    const { userEmail, canView, canEdit, canDelete } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({ error: "User email is required" });
    }
    
    // Verificar se o usuário existe
    const targetUser = await prisma.profile.findUnique({
      where: { email: userEmail }
    });
    
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Verificar se já existe um compartilhamento
    const existingShare = await prisma.sharedAccess.findFirst({
      where: {
        postId,
        userId: targetUser.id
      }
    });
    
    if (existingShare) {
      // Atualizar permissões existentes
      const updatedShare = await prisma.sharedAccess.update({
        where: { id: existingShare.id },
        data: {
          canView: canView ?? existingShare.canView,
          canEdit: canEdit ?? existingShare.canEdit,
          canDelete: canDelete ?? existingShare.canDelete
        }
      });
      
      return res.json(updatedShare);
    }
    
    // Criar novo compartilhamento
    const newShare = await prisma.sharedAccess.create({
      data: {
        postId,
        userId: targetUser.id,
        canView: canView ?? true,
        canEdit: canEdit ?? false,
        canDelete: canDelete ?? false
      }
    });
    
    res.status(201).json(newShare);
  } catch (error) {
    console.error("Share error:", error);
    res.status(500).json({ error: "Error sharing post" });
  }
});

// Rota para listar usuários com quem o post está compartilhado
app.get("/api/posts/:id/shared", authenticateToken, async (req, res) => {
  try {
    const postId = asNumber(req.params.id);
    const userId = req.userId;
    const userRole = req.userRole;

    const post = await prisma.posts.findUnique({
      where: { id: postId },
      select: { id: true, ownerId: true }
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (userRole !== 'ADMIN' && post.ownerId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const shares = await prisma.sharedAccess.findMany({
      where: { postId },
    });

    const userIds = shares.map((s) => s.userId);
    const users = userIds.length
      ? await prisma.profile.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true }
        })
      : [];

    const usersById = Object.fromEntries(users.map((u) => [u.id, u]));
    const result = shares.map((share) => ({
      id: share.id,
      userId: share.userId,
      canView: share.canView,
      canEdit: share.canEdit,
      canDelete: share.canDelete,
      user: usersById[share.userId] || null
    }));

    res.json(result);
  } catch (error) {
    console.error("List shared users error:", error);
    res.status(500).json({ error: "Error fetching shared users" });
  }
});

// Rota para remover compartilhamento de um post
app.delete("/api/posts/:id/share/:userId", authenticateToken, checkPostAccess, async (req, res) => {
  try {
    const postId = asNumber(req.params.id);
    const userId = asNumber(req.params.userId);
    
    const deletedShare = await prisma.sharedAccess.deleteMany({
      where: {
        postId,
        userId
      }
    });
    
    res.json({ message: "Share removed successfully" });
  } catch (error) {
    console.error("Remove share error:", error);
    res.status(500).json({ error: "Error removing share" });
  }
});

// Rota para obter ferramentas e licenças
app.get("/api/tools", authenticateToken, async (req, res) => {
  const tools = await prisma.tool.findMany();
  res.send(tools);
});

// Rota para criar uma nova ferramenta/licença (atualizada)
app.post("/api/tools", authenticateToken, async (req, res) => {
  const { name, description, responsible, responsibleEmail, acquisitionDate, expirationDate } = req.body;

  if (!name || !description || !responsible || !responsibleEmail || !acquisitionDate || !expirationDate) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  // Validação básica de email
  if (!emailRegex.test(responsibleEmail)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  try {
    const tool = await prisma.tool.create({
      data: {
        name,
        description,
        responsible,
        responsibleEmail,
        acquisitionDate: new Date(acquisitionDate),
        expirationDate: new Date(expirationDate),
      },
    });

    res.status(201).send(tool);
  } catch (error) {
    console.error("Erro ao criar ferramenta:", error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar uma ferramenta/licença (atualizada)
app.put("/api/tools/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, responsible, responsibleEmail, acquisitionDate, expirationDate } = req.body;

  if (!name || !description || !responsible || !responsibleEmail || !acquisitionDate || !expirationDate) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  // Validação básica de email
  if (!emailRegex.test(responsibleEmail)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  try {
    const tool = await prisma.tool.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        responsible,
        responsibleEmail,
        acquisitionDate: new Date(acquisitionDate),
        expirationDate: new Date(expirationDate),
      },
    });

    res.send(tool);
  } catch (error) {
    console.error("Erro ao atualizar ferramenta:", error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para deletar uma ferramenta/licença
app.delete("/api/tools/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const tool = await prisma.tool.delete({
    where: { id: Number(id) },
  });

  res.send(tool);
});

// Rota para criar treinamento
app.post('/api/trainings', authenticateToken, async (req, res) => {
  try {
    const { file, fields } = await parseMultipart(req);
    const { title, description, categoryId, links, isPublic } = fields;
    const userId = req.userId;

    if (!title || !description || !categoryId) {
      return res.status(400).json({ error: 'Título, descrição e categoria são obrigatórios.' });
    }

    const linksArray = Array.isArray(links) ? links : (links ? [links] : []);

    const storedName = generateUniqueFileName(file.originalname);
    await uploadFile(file.buffer, storedName, file.mimetype);

    const training = await prisma.training.create({
      data: {
        title,
        description,
        imageName: storedName,
        originalFileName: file.originalname,
        fileType: file.mimetype,
        categoryId: +categoryId,
        ownerId: userId,
        isPublic: toBoolean(isPublic),
        trainingLinks: {
          create: linksArray.map((link) => ({ url: link })),
        },
      },
      include: {
        trainingLinks: true,
      }
    });

    res.status(201).json(training);
  } catch (error) {
    console.error('Erro ao criar treinamento:', error);
    const isNoFile = error.message === 'Nenhum arquivo enviado';
    const message = isNoFile ? 'Nenhum arquivo enviado' : 'Falha no upload do arquivo';
    res.status(isNoFile ? 400 : 500).json({ error: message, details: error.message });
  }
});

// Rota para obter treinamentos
app.get('/api/trainings', authenticateToken, async (req, res) => {
  try {
    const { categoryId } = req.query;
    const userId = req.userId;
    const userRole = req.userRole;

    let filter = categoryId ? { where: { categoryId: +categoryId } } : {};
    
    // Se não for admin, filtrar apenas treinamentos públicos ou com acesso
    if (userRole !== 'ADMIN') {
      filter = {
        where: {
          AND: [
            categoryId ? { categoryId: +categoryId } : {},
            {
              OR: [
                { isPublic: true },
                { ownerId: userId },
                {
                  sharedWith: {
                    some: {
                      userId: userId,
                      canView: true
                    }
                  }
                }
              ]
            }
          ]
        }
      };
    }

    const trainings = await prisma.training.findMany({
      ...filter,
      include: {
        trainingLinks: true,
        category: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
    });

    await Promise.all(trainings.map(async (training) => {
      if (training.imageName) {
        training.imageUrl = await getObjectSignedUrl(training.imageName);
      }
    }));

    res.json(trainings);
  } catch (error) {
    console.error('Erro ao buscar treinamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para obter a imagem de um treinamento
app.get("/api/trainings/:id/image", authenticateToken, checkTrainingAccess, async (req, res) => {
  try {
    const id = asNumber(req.params.id);

    const training = await prisma.training.findUnique({ where: { id } });
    if (!training) {
      return res.status(404).json({ error: "Treinamento n?o encontrado" });
    }

    if (!training.imageName) {
      return res.status(404).json({ error: "Nenhuma imagem associada a este treinamento" });
    }

    const imageUrl = await getObjectSignedUrl(training.imageName);
    res.json({ 
      url: imageUrl, 
      originalFileName: training.originalFileName, 
      fileType: training.fileType 
    });
  } catch (error) {
    console.error("Erro na rota de imagem do treinamento:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para download do arquivo de treinamento
app.get("/api/trainings/:id/download", authenticateToken, checkTrainingAccess, async (req, res) => {
  try {
    const id = asNumber(req.params.id);
    const training = await prisma.training.findUnique({ where: { id } });

    if (!training) {
      return res.status(404).json({ error: "Treinamento n?o encontrado" });
    }

    if (!training.imageName) {
      return res.status(404).json({ error: "Nenhum arquivo associado a este treinamento" });
    }

    const fileUrl = await getObjectSignedUrl(training.imageName);
    res.json({ 
      url: fileUrl, 
      originalFileName: training.originalFileName, 
      fileType: training.fileType 
    });
  } catch (error) {
    console.error("Erro no download do treinamento:", error);
    res.status(500).json({ error: "Erro ao gerar URL de download" });
  }
});

// Rota para deletar um treinamento
app.delete("/api/trainings/:id", authenticateToken, checkTrainingAccess, async (req, res) => {
  try {
    const id = asNumber(req.params.id);
    
    const training = await prisma.training.findUnique({
      where: { id },
      include: { trainingLinks: true }
    });
    
    if (!training) {
      return res.status(404).json({ error: "Treinamento n?o encontrado" });
    }
    
    // Excluir links associados
    await prisma.trainingLink.deleteMany({
      where: { trainingId: id }
    });
    
    // Excluir compartilhamentos associados
    await prisma.sharedAccess.deleteMany({
      where: { trainingId: id }
    });
    
    // Excluir o arquivo salvo no S3, se existir
    if (training.imageName) {
      try {
        await deleteFile(training.imageName);
      } catch (err) {
        console.warn('Falha ao remover arquivo do S3 para treinamento:', err.message);
      }
    }
    
    // Excluir o treinamento
    await prisma.training.delete({ where: { id } });
    
    res.json({ message: "Treinamento exclu?do com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir treinamento:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

app.patch("/api/trainings/:id/visibility", authenticateToken, checkTrainingAccess, async (req, res) => {
  try {
    const id = asNumber(req.params.id);
    const { isPublic } = req.body;
    
    if (isPublic === undefined) {
      return res.status(400).json({ error: "isPublic field is required" });
    }
    
    const training = await prisma.training.update({
      where: { id },
      data: { isPublic: Boolean(isPublic) }
    });
    
    res.json(training);
  } catch (error) {
    console.error("Update visibility error:", error);
    res.status(500).json({ error: "Error updating training visibility" });
  }
});

// Rota para compartilhar um treinamento com outro usuário
app.post("/api/trainings/:id/share", authenticateToken, checkTrainingAccess, async (req, res) => {
  try {
    const trainingId = asNumber(req.params.id);
    const { userEmail, canView, canEdit, canDelete } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({ error: "User email is required" });
    }
    
    // Verificar se o usuário existe
    const targetUser = await prisma.profile.findUnique({
      where: { email: userEmail }
    });
    
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Verificar se já existe um compartilhamento
    const existingShare = await prisma.sharedAccess.findFirst({
      where: {
        trainingId,
        userId: targetUser.id
      }
    });
    
    if (existingShare) {
      // Atualizar permissões existentes
      const updatedShare = await prisma.sharedAccess.update({
        where: { id: existingShare.id },
        data: {
          canView: canView ?? existingShare.canView,
          canEdit: canEdit ?? existingShare.canEdit,
          canDelete: canDelete ?? existingShare.canDelete
        }
      });
      
      return res.json(updatedShare);
    }
    
    // Criar novo compartilhamento
    const newShare = await prisma.sharedAccess.create({
      data: {
        trainingId,
        userId: targetUser.id,
        canView: canView ?? true,
        canEdit: canEdit ?? false,
        canDelete: canDelete ?? false
      }
    });
    
    res.status(201).json(newShare);
  } catch (error) {
    console.error("Share error:", error);
    res.status(500).json({ error: "Error sharing training" });
  }
});

// Rota para remover compartilhamento de um treinamento
app.delete("/api/trainings/:id/share/:userId", authenticateToken, checkTrainingAccess, async (req, res) => {
  try {
    const trainingId = asNumber(req.params.id);
    const userId = asNumber(req.params.userId);
    
    const deletedShare = await prisma.sharedAccess.deleteMany({
      where: {
        trainingId,
        userId
      }
    });
    
    res.json({ message: "Share removed successfully" });
  } catch (error) {
    console.error("Remove share error:", error);
    res.status(500).json({ error: "Error removing share" });
  }
});

// Rota para obter categorias
app.get("/api/categories", async (_req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.send(categories);
  } catch (error) {
    console.error("Erro ao listar categorias:", error);
    res.status(500).json({ error: "Erro ao listar categorias" });
  }
});

// Criar categoria (apenas admin)
app.post("/api/categories", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Nome da categoria é obrigatório" });
    }

    const existing = await prisma.category.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } }
    });

    if (existing) {
      return res.status(409).json({ error: "Categoria já existe" });
    }

    const category = await prisma.category.create({
      data: { name: name.trim() }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    res.status(500).json({ error: "Erro interno ao criar categoria" });
  }
});

// Deletar categoria (apenas admin)
app.delete("/api/categories/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const id = asNumber(req.params.id);

    const inUse = await prisma.posts.findFirst({ where: { categoryId: id } }) ||
                  await prisma.training.findFirst({ where: { categoryId: id } });
    if (inUse) {
      return res.status(400).json({ error: "Categoria em uso e não pode ser removida" });
    }

    await prisma.category.delete({ where: { id } });
    res.json({ message: "Categoria removida" });
  } catch (error) {
    console.error("Erro ao remover categoria:", error);
    res.status(500).json({ error: "Erro interno ao remover categoria" });
  }
});

// Rota para obter a imagem de um post
app.get("/api/posts/:id/image", authenticateToken, checkPostAccess, async (req, res) => {
  try {
    const id = asNumber(req.params.id)

    const post = await prisma.posts.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ error: "Post n?o encontrado" });
    }

    const imageUrl = await getObjectSignedUrl(post.imageName);
    res.json({ url: imageUrl });
  } catch (error) {
    console.error("Erro na rota de imagem:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

app.post('/api/signup', async (req, res) => {
  const { email, password, name } = req.body;

  const existingProfile = await prisma.profile.findUnique({
    where: { email },
  });

  if (existingProfile) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  try {
    await prisma.profile.create({
      data: { 
        email, 
        password, 
        name,
        role: 'USER' // Por padrão, novos usuários são criados com papel USER
      },
    });

    return res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Rota para login de usuários
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const profile = await prisma.profile.findUnique({
    where: { email },
  });

  if (!profile) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (password !== profile.password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ 
    id: profile.id,
    role: profile.role
  }, secretKey, { expiresIn: '1h' });

  return res.status(200).json({ token });
});

// Rota para obter detalhes do perfil do usuário
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rota para verificar se o usuário está autenticado
app.get("/api/authenticated", authenticateToken, (req, res) => {
  return res.status(200).json({ 
    isAuthenticated: true,
    role: req.userRole
  });
});

// Rota para listar todos os usuários (apenas para admin)
app.get("/api/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await prisma.profile.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rota para promover um usuário a admin (apenas para admin)
app.patch("/api/users/:id/promote", authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = asNumber(req.params.id);
    
    const user = await prisma.profile.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updatedUser = await prisma.profile.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rota para rebaixar um admin a usuário comum (apenas para admin)
app.patch("/api/users/:id/demote", authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = asNumber(req.params.id);
    
    // Não permitir que um admin rebaixe a si mesmo
    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot demote yourself' });
    }
    
    const user = await prisma.profile.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updatedUser = await prisma.profile.update({
      where: { id: userId },
      data: { role: 'USER' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error demoting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to list all objects in the S3 bucket
app.get("/api/s3/objects", authenticateToken, isAdmin, async (req, res) => {
  try {
    const prefix = req.query.prefix ? String(req.query.prefix) : undefined;
    const objects = await listAllObjects(prefix);

    res.json(objects);
  } catch (error) {
    console.error("Error listing S3 objects:", error);
    res.status(500).json({ error: "Erro ao listar objetos do S3" });
  }
});

// CRON que verifica ferramentas prestes a expirar todos os dias ��s 6h (apenas em produ��ǜo)
if (process.env.NODE_ENV === "production") {
  cron.schedule('0 6 * * *', async () => {
    console.log('Executando verificação diária de ferramentas próximas da expiração...');
    await checkExpiringTools();
  });
} else {
  console.log("CRON desabilitado em ambiente local.");
}


app.listen(PORT, () => console.log(`listening on port ${PORT}`));
