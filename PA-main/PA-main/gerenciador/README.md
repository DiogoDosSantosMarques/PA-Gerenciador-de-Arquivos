# Express Backend 

Todo código do Backend está na pasta express, só rode os comando do Back no terminal estando dentro da pasta.

## Setup

### .env

Crie o arquivo .env no express e insira as linhas abaixo:

```env
DATABASE_URL='mysql://root:ogGRfvPABVBvInbdNxmbJxDPZhIgrEjF@maglev.proxy.rlwy.net:34044/railway/railway'

AWS_BUCKET_NAME='pa-gerenciador-arquivos'
AWS_BUCKET_REGION='us-east-1'

Também iriam aqui as chaves da AWS, como são privadas, pedimos que peça à nossa equipe se for necessário para você.

JWT_SECRET_KEY='fLz8@iC6zP#m0U76vx3h23Qx0VjzE8Fr'
```

Nesta nova versão, o banco está hospedado no Railway, você não precisa se preocupar em ter o MySql no computador. 


## Executar

```sh
npm i
npm start
```

Vá na api no [localhost 8080](http://localhost:8080)

# React Frontend

Todo código do Frontend está na pasta express, só rode os comando do Front no terminal estando dentro da pasta.

## Executar

```sh
npm i
npm run dev
```

Vá no app no [localhost 3000](http://localhost:3000)
