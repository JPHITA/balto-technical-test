import express from 'express';
import "dotenv/config";
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION, DeliveryMethod } from '@shopify/shopify-api';
import ngrok from '@ngrok/ngrok';
import { Customer } from "./services/customers";
import { Email_Service } from './services/email';
import { DB_customer, socialmedia_customer } from "./types";

// setting up the shopify api for a custom app
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

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// endpoint for social media to send customers webhooks
app.post('/socialmedia_endpoint', (req, res) => {
    try {
        // authorization token for social media
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

// endpoint for sending the congratulatory email to the top 10 customers
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

// endpoint to manage the event of a customer updating their email in shopify
app.post('/webhooks/customer_update', express.text({type: '*/*'}), async (req, res) => {
    try {
        const { valid } = await shopify.webhooks.validate({
            rawBody: req.body,
            rawRequest: req,
            rawResponse: res,
          });
        
        if (!valid) {
            console.log('Invalid webhook call, not handling it');
            res.sendStatus(400);
            return;
        }
    
        const customer: DB_customer = {
            shopify_id: req.body.id,
            email:  req.body.email,
        }
        
        await Customer.update_customer(customer);

        res.sendStatus(200);
    } catch (error) {
        console.log(error);
    }
});

// endpoint to manage the event of a customer creating their account in shopify
app.post('/webhooks/customer_create', express.text({type: '*/*'}), async (req, res) => {
    try {
        const { valid } = await shopify.webhooks.validate({
            rawBody: req.body,
            rawRequest: req,
            rawResponse: res,
          });
        
        if (!valid) {
            console.log('Invalid webhook call, not handling it');
            res.sendStatus(400);
            return;
        }

        const customer: DB_customer = {
            shopify_id: req.body.id,
            email:  req.body.email,
            likes_gained: 0,
            followers_gained: 0
        }
        
        await Customer.register_customer(customer);

        res.sendStatus(200);
    } catch (error) {
        console.log(error);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

ngrok.connect({addr: port, authtoken_from_env: true}).then(async (listener) => {
    shopify.webhooks.addHandlers({
        'CUSTOMERS_CREATE': [
            {
                deliveryMethod: DeliveryMethod.Http,
                callbackUrl: listener.url() + '/webhooks/customer_create',
            },
        ],
        'CUSTOMERS_UPDATE': [
            {
                deliveryMethod: DeliveryMethod.Http,
                callbackUrl: listener.url() + '/webhooks/customer_update',
            },
        ]
    });

    const webhooks = await shopify.webhooks.register({ session });
    console.log(webhooks);

    console.log("ngrok running on: ", listener.url());
});