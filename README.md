# Mon Vieux Grimoire

Project #7 of OpenClassrooms certification / Fullstack Web Developer

Develop the back-end of a book review platform using an API built from scratch with Express.js

## Preview

-   Hosted back-end (fully functional, DB is restored to initial state on a regular basis for security reasons): https://oc-7-mon-vieux-grimoire-back-end.vercel.app
-   OpenAPI / Swagger documentation: https://oc-7-mon-vieux-grimoire-back-end.vercel.app/api-docs/
-   Hosted front-end: https://oc-7-mon-vieux-grimoire.vercel.app/
-   Based on this Figma design: https://www.figma.com/file/vaXTVVMP7LvOwt80pJXJoQ/OC-P7---Mon-Vieux-Grimoir?type=design&mode=design&t=RxVv8W9HimR5F41r-1

## Technologies (back-end)

-   [Express.js](https://expressjs.com/)
-   [MongoDB Atlas](https://www.mongodb.com/atlas/database)
-   [Cloudinary](https://cloudinary.com/) (for images hosting for back-end hosted on Vercel only, images are stored locally when back-end runs on localhost)

## Back-end

### ⚠️ Important Notes

This project's backend needs a .env file to work properly on local\
It is not hosted on this Github repo, please get in touch with the author in order to get it

### 🛠️ Install Dependencies

```bash
cd backend
npm install
```

### 🧑🏻‍💻 Usage

```bash
npm run start     # To start Node.js server
npm run dev       # To start Node.js server in watch mode
npm run debug     # To start with debugger
# default server: http://localhost:4000
```

_Tested with Node.js 20.9.0 and NPM 10.1.0_

### 🕮 Postman collection

https://github.com/ThibautRoe/OC-Projet7-Mon-Vieux-Grimoire/blob/main/backend/postman.postman_collection.json

## Front-end

### 🛠️ Install Dependencies

```bash
cd frontend
npm install
```

### 🧑🏻‍💻 Usage

```bash
npm run start
npm run build
npm run test
# default server: http://localhost:3000
```

_Tested with Node.js 16_
