const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth.route');
const protectedRoutes = require('./routes/protected');
require('dotenv').config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected')).catch(err => console.error(err));

app.use('/auth', authRoutes);
app.use('/user', protectedRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Server is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
