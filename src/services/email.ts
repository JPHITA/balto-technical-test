import nodemailer from 'nodemailer';
import { shopify_customer, DB_customer } from "./../types";

/**
 * Represents an email service that sends congratulatory emails to customers.
 */
const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.email_user,
      pass: process.env.app_pasword,
    },
});

export class Email_Service{
    /**
     * Sends the congratulatory email to a customer.
     * @param shopify_cust - The Shopify customer object.
     * @param DB_cust - The database customer object.
     */
    public static async send_email(shopify_cust: shopify_customer, DB_cust: DB_customer){
        try {

            // Format the date when the customer signed up.
            let date_signed_up = (new Date(shopify_cust.createdAt)).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric' 
            });

            const mailOptions = {
                from: process.env.email_user,
                to: shopify_cust.email,
                subject: "Congrats for your success on social media with Balto!!",
                html: `
                <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 20px;
                            background-color: #f7f7f7;
                            }
                        
                            .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #ffffff;
                            padding: 20px;
                            border-radius: 8px;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                            }
                        
                            h1 {
                            color: #333333;
                            margin-bottom: 20px;
                            }
                        
                            p {
                            color: #555555;
                            line-height: 1.6;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Congratulations, ${shopify_cust.displayName}!</h1>
                            <p>Ever since you became a Balto customer on ${date_signed_up}, you've gained ${DB_cust.likes_gained} likes and ${DB_cust.followers_gained} follows.</p>
                        </div>
                    </body>
                </html>
                `
            };

            const info = transporter.sendMail(mailOptions);

            return info;
        } catch (error) {
            throw error;
        }
    }
}