import { sqs } from "../utils/globalSqsMessage.js";
import GeneralAudit from "../models/generalAuditModel.js";

// Function to poll messages from SQS
const pollSQSMessages = async () => {

    const queueURL = process.env.AWS_SQS_URL;

    const params = {
        QueueUrl: queueURL,
        MaxNumberOfMessages: 10, // Adjust based on your requirement
        WaitTimeSeconds: process.env.AWS_SQS_WAIT_TIME // Use long polling
    };

    sqs.receiveMessage(params, (err, data) => {
        if (err) {
            console.log("Receive Error", err);
        } else if (data?.Messages) {

            data?.Messages?.forEach(message => {
                
                // Manually correct the format
                const messageString = message?.Body?.replace(/(\w+):/g, '"$1":').replace(/:([^"]+?)([,}])/g, ':"$1"$2');
                const mostRecentMessage = JSON.parse(messageString);
                
                // Handle message here...
                console.log("Received message:", mostRecentMessage);
                
                if (('organization_id' in mostRecentMessage)) {
                    // Creating a new generalAudit instance
                    const generalAudit = new GeneralAudit({
                        organization_id: mostRecentMessage?.organization_id ? mostRecentMessage?.organization_id : "",
                        table_name: mostRecentMessage?.table_name ? mostRecentMessage?.table_name : "",
                        module_name: mostRecentMessage?.module_name ? mostRecentMessage?.module_name : "",
                        user_name: mostRecentMessage?.user_name ? mostRecentMessage?.user_name : "",
                        action_taken: mostRecentMessage?.action_taken ? mostRecentMessage?.action_taken : "",
                    });

                    generalAudit.save();
                }
                
                // Delete message from queue after processing
                const deleteParams = {
                    QueueUrl: queueURL,
                    ReceiptHandle: message.ReceiptHandle
                };

                sqs.deleteMessage(deleteParams, (err, data) => {
                    if (err) {
                        console.log("Delete Error", err);
                    } else {
                        console.log("Message Deleted", data);
                    }
                });

            });
        }
    });

};

export { pollSQSMessages }