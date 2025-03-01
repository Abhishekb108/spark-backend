const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect('mongodb+srv://bansalabhi1008:bansal%40108@cluster0.pgrqp.mongodb.net/linkhub?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = new User({
      username: 'bansalabhi1008',
      email: 'bansalabhi1008@gmail.com',
      password: hashedPassword,
      name: 'Abhishek Bansal'
    });
    await user.save();
    console.log('User created:', user);
    mongoose.connection.close();
  })
  .catch(err => console.error('Error:', err));