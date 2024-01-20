import express from 'express';
import "dotenv/config";
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import { Customer } from "./services/customers";
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
const client = new shopify.clients.Graphql({session});

const app = express();
const port = 3000;

app.use(express.json());

// app.get('/', async (req, res) => {
//     const r = await Customer.get_shopify_customer(client, 6989017612483);

//     res.send(r);
// });

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
    
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
