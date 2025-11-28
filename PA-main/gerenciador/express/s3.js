import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import dotenv from 'dotenv'

dotenv.config()

// Carrega as credenciais e configurações do bucket a partir das variáveis de ambiente.
const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION || 'us-east-1'
// Suporta tanto variáveis padrão da AWS quanto as usadas anteriormente
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY
const endpoint = process.env.AWS_S3_ENDPOINT
const forcePathStyle = String(process.env.AWS_S3_FORCE_PATH_STYLE || '').toLowerCase() === 'true'

if (!bucketName || !accessKeyId || !secretAccessKey) {
  throw new Error('AWS S3 credentials/config missing. Verifique AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY no .env')
}

const clientConfig = {
  region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
}

if (endpoint) {
  clientConfig.endpoint = endpoint
  clientConfig.forcePathStyle = forcePathStyle
}

const s3Client = new S3Client(clientConfig)

const downloadFile = async ({id}) => {
  try {
    const response = await axios.get(`/api/posts/${id}/download`);
    
    // Cria um elemento de âncora (<a>) para simular o download do arquivo.
    const a = document.createElement('a');
    a.href = response.data.url;
    a.download = response.data.originalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download error:', error);
    alert('Could not download file');
  }
};

// Função para fazer upload de arquivos no S3.
export function uploadFile(fileBuffer, fileName, mimetype) {
  const uploadParams = {
    Bucket: bucketName,
    Body: fileBuffer,
    Key: fileName,
    ContentType: mimetype
  }

  return s3Client.send(new PutObjectCommand(uploadParams));
}

// Função para deletar arquivos do S3.
export function deleteFile(fileName) {
  const deleteParams = {
    Bucket: bucketName,
    Key: fileName,
  }

  return s3Client.send(new DeleteObjectCommand(deleteParams));
}

// Função para gerar uma URL assinada de um objeto armazenado no S3.
export async function getObjectSignedUrl(key) {
  const params = {
    Bucket: bucketName,
    Key: key
  }

  // https://aws.amazon.com/blogs/developer/generate-presigned-url-modular-aws-sdk-javascript/
  const command = new GetObjectCommand(params);
  const seconds = 60 * 5
  const url = await getSignedUrl(s3Client, command, { expiresIn: seconds });

  return url
}

// Lista todos os objetos do bucket, percorrendo a pagina��ǜo caso existam mais de 1000 itens.
export async function listAllObjects(prefix) {
  const allObjects = [];
  let continuationToken;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken
    });

    const response = await s3Client.send(command);
    const contents = response.Contents || [];

    contents.forEach((item) => {
      allObjects.push({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        eTag: item.ETag
      });
    });

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return allObjects;
}
