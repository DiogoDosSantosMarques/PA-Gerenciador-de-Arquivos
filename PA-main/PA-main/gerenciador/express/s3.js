import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import dotenv from 'dotenv'

dotenv.config()

// Carrega as credenciais e configurações do bucket a partir das variáveis de ambiente.
const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
})

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