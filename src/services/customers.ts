import { GraphqlClient } from "@shopify/shopify-api/lib/clients/admin/graphql/client";
import { socialmedia_customer } from "../types";
import { Database } from "../../db/customersDB";

export class Customer {

    public static async save_from_socialmedia(customers: socialmedia_customer[]){
        const db = await Database.init();
        
        db.run("BEGIN TRANSACTION");

        for (const customer of customers) {
            const customer_exists = await Customer.verify_customer_exists(customer.customer_shopify_id);

            if (customer_exists) {
                await Customer.update_socialmedia_customer(customer);
            } else {
                await Customer.register_socialmedia_customer(customer);
            }
        }

        db.run("COMMIT");
    }
    
    public static async register_socialmedia_customer(customer: socialmedia_customer){
        const db = await Database.init();
    
        const res = db.run(
            "INSERT INTO users (shopify_id, email, likes_gained, followers_gained) VALUES (?, ?, ?, ?)",
            customer.customer_shopify_id, customer.email, customer.likes_gained_today, customer.followers_gained_today
        );

        return res;
    }

    public static async update_socialmedia_customer(customer: socialmedia_customer){
        const db = await Database.init();

        const res = db.run(
            `
            UPDATE users SET 
                likes_gained = likes_gained + ?,
                followers_gained = followers_gained + ?,
                email = ? 
            WHERE shopify_id = ?
            `,
            customer.likes_gained_today, customer.followers_gained_today, customer.email, customer.customer_shopify_id
        );

        return res;
    }

    public static async verify_customer_exists(customer_shopify_id: number){
        const db = await Database.init();

        const res = await db.get(
            "SELECT EXISTS (SELECT 1 FROM users WHERE shopify_id = ?) AS exists_shopify_id",
            customer_shopify_id
        );

        return res.exists_shopify_id === 1;
    }
}




// async function getCustomers(client: GraphqlClient){
//     const customers = await client.request(
//         `{
//             customers(first: 10) {
//                 edges {
//                     node {
//                         id
//                         displayName
//                         email
//                     }
//                 }
//             }
//         }`
//     );

//     return customers.data?.customers.edges.map((edge: any) => edge.node);
// }