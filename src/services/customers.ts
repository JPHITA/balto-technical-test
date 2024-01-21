import { GraphqlClient } from "@shopify/shopify-api/lib/clients/admin/graphql/client";
import { socialmedia_customer, shopify_customer, DB_customer } from "../types";
import { Database } from "../../db/customersDB";

export class Customer {

    public static async save_from_socialmedia(client: GraphqlClient, customers: socialmedia_customer[]) {
        const db = await Database.init();

        try {
            db.run("BEGIN TRANSACTION");

            for (const customer of customers) {                
                const DBcustomer: DB_customer = {
                    shopify_id: customer.customer_shopify_id,
                    likes_gained: customer.likes_gained_today,
                    followers_gained: customer.followers_gained_today
                }

                await Customer.update_socialmedia_customer(DBcustomer);
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
                "INSERT INTO users (shopify_id, email, likes_gained, followers_gained) VALUES (?, ?, 0, 0)",
                customer.shopify_id, customer.email
            );

            return res;
        } catch (error) {
            throw error;
        }
    }

    public static async update_socialmedia_customer(customer: DB_customer) {
        const db = await Database.init();

        try {
            const params = [];
            let fields = "";
            for (const key in customer) {
                const field = key as keyof DB_customer;

                if (["shopify_id", "id"].includes(field)) continue;
                if (customer[field] === undefined) continue;

                params.push(customer[field]);

                if (field === "email") {
                    fields += "email = ?,"
                } else {
                    fields += `${field} = ${field} + ?,`
                }
            }

            const res = db.run(
                `
                UPDATE users SET 
                    ${fields.slice(0, -1)}
                WHERE shopify_id = ?
                `,
                ...params, customer.shopify_id
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