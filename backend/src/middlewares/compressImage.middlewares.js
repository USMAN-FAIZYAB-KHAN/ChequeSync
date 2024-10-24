import sharp from 'sharp';
import { MongoClient, Binary } from 'mongodb';

async function compressAndSaveImage(imagePath) {
    try {
        // Compress the image using Sharp
        const compressedImageBuffer = await sharp(imagePath)
            .jpeg({ quality: 75 }) // Set quality for compression (0-100)
            .toBuffer();
        
        // Connect to MongoDB
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true });
        const db = client.db('your_database_name');
        const collection = db.collection('images');
        
        // Store the compressed image in MongoDB as a binary object
        const result = await collection.insertOne({
            image: new Binary(compressedImageBuffer),
            createdAt: new Date()
        });

        console.log('Image saved successfully:', result.insertedId);
        client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

compressAndSaveImage('path_to_your_cheque_image.jpg');
