import express from 'express';
import "dotenv/config";
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';

const shopify = shopifyApi({
    apiKey: process.env.api_key,
    apiSecretKey: process.env.api_secret_key as string,
    hostName: "localhost:3000",
    apiVersion: LATEST_API_VERSION,
    isEmbeddedApp: false,
    scopes: ["customer_read_customers", "customer_write_customers"]
});

const session = shopify.session.customAppSession("test-store8524.myshopify.com");
session.accessToken = process.env.access_token;
const client = new shopify.clients.Graphql({session});

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    client.query({
        data: `{
            shop {
                name
            }
        }`, 
    }).then((response) => {
        console.log(response)
        res.send(response)
    }).catch((error) => {
        console.log(error)
        res.send(error)
    })
});

app.post

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
