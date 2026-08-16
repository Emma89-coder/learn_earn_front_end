const API_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production'
    ? 'https://learnern.onrender.com'
    : 'http://localhost:5000'
);

export default API_URL;
