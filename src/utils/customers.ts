import { GraphqlClient } from "@shopify/shopify-api/lib/clients/admin/graphql/client";
import { socialmedia_customer } from "../types";
import { Database } from "./../../db/customersDB";

async function registerCustomer(customers: socialmedia_customer){
    const db = await Database.init();

    db.run(
        "INSERT OR IGNORE INTO users (shopify_id, email, likes_gained, followers_gained) VALUES (?, ?, ?, ?)",
        customers.customer_shopify_id, customers.email, customers.likes_gained_today, customers.followers_gained_today
    );
}


export {
    registerCustomer
    // getCustomers
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