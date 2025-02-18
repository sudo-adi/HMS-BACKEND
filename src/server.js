require('dotenv').config();
const app = require('./app');

const port = process.env.PORT || 8384;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});