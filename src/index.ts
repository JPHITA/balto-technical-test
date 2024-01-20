import express from 'express';
import "dotenv/config";
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import { registerCustomer } from "./utils/customers";
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

app.get('/', async (req, res) => {
    // let customers = await getCustomers(client);

    // res.send(customers);
    // console.log(customers);

    registerCustomer({
        customer_shopify_id: 123,
        email: "sss",
        likes_gained_today: 0,
        followers_gained_today: 0
    });

    res.send("ok");
});

app.post('/socialmedia_endpoint', (req, res) => {
    try {
        const customers = req.body.payload as socialmedia_customer[];

        customers.forEach((customer) => {
            registerCustomer(customer);
        });
        
        // TODO:
        // actualizar los likes y followers de los usuarios
        // actualizar en la API los usuarios que se nuevos ?????

        res.status(200).send("ok");
    } catch (error) {
        res.status(500).send(error);
    }

});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
