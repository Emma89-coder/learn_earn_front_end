const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend.onrender.com' 
  : 'http://localhost:3000';

export default API_URL;