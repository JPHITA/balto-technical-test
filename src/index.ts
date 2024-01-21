import express from 'express';
import "dotenv/config";
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION, DeliveryMethod } from '@shopify/shopify-api';
import { Customer } from "./services/customers";
import { Email_Service } from './services/email';
import { socialmedia_customer } from "./types";

const shopify = shopifyApi({
    apiKey: process.env.api_key,
    apiSecretKey: process.env.api_secret_key as string,
    hostName: "localhost:3000",
    apiVersion: LATEST_API_VERSION,
    isEmbeddedApp: false,
    scopes: ["customer_read_customers", "customer_write_customers"]
});

const session = shopify.session.customAppSession(process.env.shop_domain as string);
session.accessToken = process.env.access_token;
const client = new shopify.clients.Graphql({ session });

(async () => {
    shopify.webhooks.addHandlers({
        'CUSTOMERS_CREATE': [
            {
                deliveryMethod: DeliveryMethod.Http,
                // callbackUrl: 'https://host/webhooks',
                callbackUrl: '/webhooks',
                callback: async (
                    ...data
                ) => {
                    console.log(data);
                }
            },
        ],
        'CUSTOMERS_UPDATE': [
            {
                deliveryMethod: DeliveryMethod.Http,
                // callbackUrl: 'https://host/webhooks',
                callbackUrl: '/webhooks',
                callback: async (
                    ...data
                ) => {
                    console.log(data);
                }
            },
        ]
    });

    const webhooks = await shopify.webhooks.register({ session });

    console.log(webhooks);
})();

const app = express();
const port = 3000;

app.use(express.json());

app.post('/socialmedia_endpoint', (req, res) => {
    try {
        // if (req.headers.authorization !== "auth token for social media"){
        //     return res.sendStatus(401);
        // }

        const customers = req.body.payload as socialmedia_customer[];

        Customer.save_from_socialmedia(client, customers);

        res.sendStatus(200);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }

});

app.get('/send_email', async (req, res) => {
    try {
        const top_socialmedia_customers = await Customer.get_top_socialmedia_customers();

        for (const customer of top_socialmedia_customers) {
            const shopify_customer = await Customer.get_shopify_customer(client, customer.shopify_id);

            Email_Service.send_email(shopify_customer!, customer);
        }

        res.sendStatus(200);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.post('/webhooks', express.text({ type: '*/*' }), async (req, res) => {
    try {
        await shopify.webhooks.process({
            rawBody: req.body,
            rawRequest: req,
            rawResponse: res,
        });
    } catch (error) {
        console.log(error);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
