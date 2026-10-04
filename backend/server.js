require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Warehouse API is running'));

app.use('/auth', require('./routes/authRoutes'));
app.use('/orders', require('./routes/orderRoutes'));
app.use('/tasks', require('./routes/taskRoutes'));
app.use('/staff', require('./routes/staffRoutes'));

const PORT = process.env.PORT || 5001;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});