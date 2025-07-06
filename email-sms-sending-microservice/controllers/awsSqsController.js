import asyncHandler from "express-async-handler";
import dotEnv from "dotenv";
import { sqs } from "../utils/globalSqsMessage.js";
dotEnv.config(); // allow .env file to load




// View latest sms from aws sqs
const viewLatestAwsSqsMsg = asyncHandler(async (req, res) => {
    let organizationId;
    if (req.query.organizationId) organizationId = req.query.organizationId; // String

    const params = {
      QueueUrl: process.env.AWS_SQS_URL,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: process.env.AWS_SQS_WAIT_TIME, // Optional: Long polling
    };
    try {
      
      const data = await sqs.receiveMessage(params).promise();
      
      if(data?.Messages?.length === 0) {
        return res.status(200).json({ message: 'No message Found' });
      }

      let result = []
      data?.Messages?.forEach(async(message) => {
        
        // show current message
        const currentMessage = JSON.parse(message.Body);

        if( organizationId === currentMessage?.organizationId){

          result.push(currentMessage);

          await sqs.deleteMessage({
          QueueUrl: process.env.AWS_SQS_URL,
          ReceiptHandle: message.ReceiptHandle,
          }).promise();
        }
    });

    if(result?.length > 0){
      res.status(200).json({ message: "View latest message history details", data: result});
    } else {
      res.status(200).json({ message: 'No message Found' });
    }
    } catch (err) {
      console.log("Error from View latest message:", err);
      return res.status(404).json({ message: "View latest message not found." });
    }
  });

export {
   viewLatestAwsSqsMsg
};
