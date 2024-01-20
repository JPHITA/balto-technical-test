import { GraphqlClient } from "@shopify/shopify-api/lib/clients/admin/graphql/client";
import { socialmedia_customer, shopify_customer, DB_customer } from "../types";
import { Database } from "../../db/customersDB";

export class Customer {

    public static async save_from_socialmedia(client: GraphqlClient, customers: socialmedia_customer[]) {
        const db = await Database.init();

        try {
            db.run("BEGIN TRANSACTION");

            for (const customer of customers) {
                const customer_exists = await Customer.verify_customer_exists(customer.customer_shopify_id);
                
                const DBcustomer: DB_customer = {
                    shopify_id: customer.customer_shopify_id,
                    email: "",
                    likes_gained: customer.likes_gained_today,
                    followers_gained: customer.followers_gained_today
                }

                // get email
                const shopify_customer = await Customer.get_shopify_customer(client, customer.customer_shopify_id);
                DBcustomer.email = shopify_customer?.email!;

                if (customer_exists) {
                    await Customer.update_socialmedia_customer(DBcustomer);
                } else {
                    await Customer.register_socialmedia_customer(DBcustomer);
                }
            }

            db.run("COMMIT");
        } catch (error) {
            db.run("ROLLBACK");
            throw error;
        }
    }
    
    public static async register_socialmedia_customer(customer: DB_customer) {
        const db = await Database.init();
        
        try {
            const res = await db.run(
                "INSERT INTO users (shopify_id, email, likes_gained, followers_gained) VALUES (?, ?, ?, ?)",
                customer.shopify_id, customer.email, customer.likes_gained, customer.followers_gained
            );

            return res;
        } catch (error) {
            throw error;
        }
    }

    public static async update_socialmedia_customer(customer: DB_customer) {
        const db = await Database.init();

        try {
            const res = db.run(
                `
                UPDATE users SET 
                    likes_gained = likes_gained + ?, followers_gained = followers_gained + ?, email = ? WHERE shopify_id = ?
                `,
                customer.likes_gained, customer.followers_gained, customer.email, customer.shopify_id
            );

            return res;
        } catch (error) {
            throw error;
        }
    }

    public static async get_top_socialmedia_customers() {
        const db = await Database.init();

        try {
            const res = await db.all<DB_customer[]>(
                `
                SELECT * FROM users ORDER BY followers_gained DESC, likes_gained DESC LIMIT 10
                `
            );

            return res;
        } catch (error) {
            throw error;
        }
    }

    public static async verify_customer_exists(customer_shopify_id: number) {
        const db = await Database.init();

        try {
            const res = await db.get(
                "SELECT EXISTS (SELECT 1 FROM users WHERE shopify_id = ?) AS exists_shopify_id",
                customer_shopify_id
            );

            return res.exists_shopify_id === 1;
        } catch (error) {
            throw error;
        }
    }

    public static async get_shopify_customer(client: GraphqlClient, shopify_id: number) {
        try {
            
            const customer = await client.request<{customer: shopify_customer}>(`
                query getCustomer($id: ID!) {
                    customer(id: $id) {
                        id
                        displayName
                        email
                        createdAt
                    }
                }
            `,
            {
                variables: {
                    id: "gid://shopify/Customer/" + shopify_id
                }
            });

            return customer.data?.customer;

        } catch (error) {
            throw error;
        }
    }
}