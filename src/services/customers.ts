import { GraphqlClient } from "@shopify/shopify-api/lib/clients/admin/graphql/client";
import { socialmedia_customer, shopify_customer, DB_customer } from "../types";
import { Database } from "../../db/customersDB";


/**
 * class containing the functions to manage the logic for a customer.
 */
export class Customer {

    /**
     * Saves customers sent from the socialmedia to the local customers database.
     * 
     * @param client - The GraphQL client.
     * @param customers - An array of social media customers to save.
     */
    public static async save_from_socialmedia(client: GraphqlClient, customers: socialmedia_customer[]) {
        const db = await Database.init();

        try {
            db.run("BEGIN TRANSACTION");

            for (const customer of customers) {     
                const customer_exists = await Customer.verify_customer_exists(customer.customer_shopify_id);

                const DBcustomer: DB_customer = {
                    shopify_id: customer.customer_shopify_id,
                    likes_gained: customer.likes_gained_today,
                    followers_gained: customer.followers_gained_today
                }

                if (customer_exists) {
                    await Customer.update_customer(DBcustomer);
                }else{
                    const new_customer_email = (await Customer.get_shopify_customer(client, customer.customer_shopify_id))!.email;
                    DBcustomer.email = new_customer_email;

                    await Customer.register_customer(DBcustomer);
                }
            }

            db.run("COMMIT");
        } catch (error) {
            db.run("ROLLBACK");
            throw error;
        }
    }
    

    /**
     * Registers a customer in the local customers database.
     * @param customer - The customer object to be registered.
     */
    public static async register_customer(customer: DB_customer) {
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

    /**
     * Updates a customer in the database.
     * @param customer - The customer object to update.
     */
    public static async update_customer(customer: DB_customer) {
        const db = await Database.init();

        try {
            // only update the fields that are not undefined
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

    
    /**
     * Retrieves the top social media customers based on the number of followers gained and likes gained.
     */
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
    

    /**
     * Verifies if a customer with the given Shopify ID exists in the database.
     * @param customer_shopify_id - The Shopify ID of the customer to verify.
     */
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


    /**
     * Retrieves a Shopify customer by their ID.
     * @param client - The GraphQL client.
     * @param shopify_id - The ID of the Shopify customer.
     */
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