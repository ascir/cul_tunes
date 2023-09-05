const AWS = require('aws-sdk');
const fs = require('fs');
require('dotenv').config();

// Configure AWS SDK with your credentials and region
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.REGION, // e.g., 'us-east-1'
});

// Create an S3 instance
const s3 = new AWS.S3();

// Define S3 bucket name and JSON file name
const bucketName = process.env.BUCKET_NAME;
const fileName = process.env.FILE_NAME;

// Read the JSON file
const jsonContent = fs.readFileSync('count.json', 'utf8');

console.log(bucketName);
console.log(fileName);
console.log(process.env.AWS_SECRET_ACCESS_KEY)
// Define S3 parameters for file upload
const params = {
  Bucket: bucketName,
  Key: fileName,
  Body: jsonContent,
  ContentType: 'application/json',
};

// Upload the JSON file to S3
s3.upload(params, (err, data) => {
  if (err) {
    console.error('Error uploading file:', err);
  } else {
    console.log('File uploaded successfully:', data.Location);

    // Download the JSON file from S3
    s3.getObject({ Bucket: bucketName, Key: fileName }, (err, data) => {
      if (err) {
        console.error('Error downloading file:', err);
      } else {
        const downloadedJson = JSON.parse(data.Body.toString('utf8'));
        console.log('File downloaded successfully:', downloadedJson);

        // You can now work with the downloaded JSON data as needed
        // For example, you can update it and upload it again
      }
    });
  }
});
