require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
console.log(model ? 'Model loaded' : 'Failed');
