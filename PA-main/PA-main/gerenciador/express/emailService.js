import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv'; // Adicionar para carregar variáveis de ambiente

// Carregar variáveis de ambiente
dotenv.config();

const prisma = new PrismaClient();

console.log('Configurações de Email:');
console.log(`- Host: ${process.env.EMAIL_HOST}`);
console.log(`- Port: ${process.env.EMAIL_PORT}`);
console.log(`- Secure: ${process.env.EMAIL_SECURE}`);
console.log(`- User: ${process.env.EMAIL_USER ? '******' : 'não definido'}`);
console.log(`- Password: ${process.env.EMAIL_PASSWORD ? '******' : 'não definido'}`);

// Configuração do transportador de email com mais logs
const createTransporter = () => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'gerenciadordedocumentos82@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'jhbr ulzn epnw orlt',
      },
      tls: {
        rejectUnauthorized: false // Permite certificados autoassinados em desenvolvimento
      }
    });
    
    console.log('Transportador de email criado com sucesso');
    return transporter;
  } catch (error) {
    console.error('Erro ao criar transportador de email:', error);
    throw error;
  }
};

// Função para verificar se uma ferramenta está próxima da expiração
const isNearExpiration = (expirationDate) => {
  const today = new Date();
  const expDate = new Date(expirationDate);
  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
  
  // Retorna true se faltar 30, 15, 7 ou 3 dias para expirar
  return [30, 15, 7, 6, 5, 4, 3, 2, 1].includes(diffDays);
};

// Função para enviar email de notificação
export const sendExpirationNotification = async (tool) => {
  const { id, name, description, responsible, responsibleEmail, expirationDate } = tool;
  
  console.log(`Tentando enviar notificação para ferramenta ${name} (ID: ${id})`);
  
  const formattedDate = new Date(expirationDate).toLocaleDateString('pt-BR');
  const daysUntilExpiration = Math.ceil(
    (new Date(expirationDate) - new Date()) / (1000 * 3600 * 24)
  );
  
  // Verifica se há um email para notificar
  if (!responsibleEmail) {
    console.error(`Ferramenta ${name} (ID: ${id}) não possui email de responsável definido`);
    return { success: false, error: 'Email do responsável não definido' };
  }
  
  try {
    // Criar um transportador sob demanda para cada envio
    const transporter = createTransporter();
    
    // Verificar se o transportador está pronto
    transporter.verify(function(error, success) {
      if (error) {
        console.error('Erro na verificação do transportador:', error);
      } else {
        console.log('Servidor está pronto para enviar mensagens');
      }
    });
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Sistema de Gerenciamento" <gerenciadordedocumentos82@gmail.com>',
      to: responsibleEmail,
      subject: `ALERTA: Ferramenta ${name} expira em ${daysUntilExpiration} dias`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Alerta de Expiração</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); margin-top: 20px; margin-bottom: 20px;">
            <!-- Cabeçalho -->
            <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 30px 25px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Alerta de Expiração</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 16px;">Ferramenta/Licença Próxima ao Vencimento</p>
            </div>
            
            <!-- Conteúdo -->
            <div style="padding: 30px 25px;">
              <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Olá, <strong style="color: #4f46e5;">${responsible}</strong>.</p>
              <p style="font-size: 16px; line-height: 1.6;">Este é um aviso importante sobre a ferramenta/licença sob sua responsabilidade:</p>
              
              <!-- Card da ferramenta -->
              <div style="background-color: #f3f4f6; border-radius: 10px; padding: 20px; margin: 25px 0; border-left: 5px solid #4f46e5; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                <h2 style="margin-top: 0; color: #4f46e5; font-size: 20px; font-weight: 600;">${name}</h2>
                
                <div style="margin: 15px 0;">
                  <p style="margin: 8px 0; font-size: 15px;">
                    <strong style="color: #4b5563; display: inline-block; width: 100px;">Descrição:</strong> 
                    <span>${description}</span>
                  </p>
                  
                  <p style="margin: 8px 0; font-size: 15px;">
                    <strong style="color: #4b5563; display: inline-block; width: 100px;">Expiração:</strong> 
                    <span style="font-weight: 500;">${formattedDate}</span>
                  </p>
                  
                  <div style="background-color: #fee2e2; border-radius: 8px; padding: 10px 15px; margin-top: 15px; display: flex; align-items: center;">
                    <div style="background-color: #ef4444; width: 8px; height: 8px; border-radius: 50%; margin-right: 10px;"></div>
                    <p style="margin: 0; font-size: 15px;">
                      <strong style="color: #b91c1c;">Dias Restantes:</strong> 
                      <span style="color: #b91c1c; font-weight: 700;">${daysUntilExpiration} dias</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6;">Por favor, tome as medidas necessárias para renovar esta licença ou ferramenta antes que expire.</p>
              
              <!-- Botão de ação -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">Acessar Sistema</a>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6;">Atenciosamente,<br><strong>Sistema de Gerenciamento de Ferramentas e Licenças</strong></p>
            </div>
            
            <!-- Rodapé -->
            <div style="background-color: #f3f4f6; padding: 20px 25px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 13px; color: #6b7280; margin: 0;">Este é um email automático. Não responda a esta mensagem.</p>
              <p style="font-size: 13px; color: #6b7280; margin: 10px 0 0;">© 2025 Sistema de Gerenciamento de Ferramentas e Licenças</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    console.log(`Enviando email para ${responsibleEmail} sobre a ferramenta ${name}`);
    
    // Enviar email com promise para melhor tratamento de erros
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email enviado com sucesso para ${responsibleEmail}: ${info.messageId}`);
    
    // Atualiza a data da última notificação
    await prisma.tool.update({
      where: { id: tool.id },
      data: { lastNotification: new Date() }
    });
    console.log(`Registro de notificação atualizado para ferramenta ${name} (ID: ${id})`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Erro ao enviar email para ${responsibleEmail}:`, error);
    return { success: false, error: error.message };
  }
};

// Função para verificar todas as ferramentas e enviar notificações
export const checkExpiringTools = async () => {
  console.log('Iniciando verificação de ferramentas próximas da expiração...');
  
  try {
    const tools = await prisma.tool.findMany();
    console.log(`Encontradas ${tools.length} ferramentas para verificar`);
    
    let notificationsSent = 0;
    let toolsNearExpiration = 0;
    
    for (const tool of tools) {
      const daysUntilExpiration = Math.ceil(
        (new Date(tool.expirationDate) - new Date()) / (1000 * 3600 * 24)
      );
      
      if (isNearExpiration(tool.expirationDate)) {
        toolsNearExpiration++;
        console.log(`Ferramenta ${tool.name} (ID: ${tool.id}) está próxima da expiração (${daysUntilExpiration} dias)`);
        
        // Verifica se já enviou notificação hoje
        const shouldSendNotification = !tool.lastNotification || 
          new Date(tool.lastNotification).toDateString() !== new Date().toDateString();
        
        if (shouldSendNotification) {
          console.log(`Enviando notificação para ferramenta ${tool.name} (ID: ${tool.id})`);
          const result = await sendExpirationNotification(tool);
          
          if (result.success) {
            notificationsSent++;
          } else {
            console.error(`Falha ao enviar notificação para ferramenta ${tool.name} (ID: ${tool.id}):`, result.error);
          }
        } else {
          console.log(`Notificação já enviada hoje para ferramenta ${tool.name} (ID: ${tool.id})`);
        }
      } else {
        console.log(`Ferramenta ${tool.name} (ID: ${tool.id}) não está próxima da expiração (${daysUntilExpiration} dias)`);
      }
    }
    
    console.log(`Verificação concluída: ${toolsNearExpiration} ferramentas próximas da expiração, ${notificationsSent} notificações enviadas`);
    return { success: true, notificationsSent, toolsNearExpiration };
  } catch (error) {
    console.error('Erro ao verificar ferramentas:', error);
    return { success: false, error: error.message };
  } finally {
    // Fechando a conexão do Prisma
    await prisma.$disconnect();
  }
};