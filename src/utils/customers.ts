import { GraphqlClient } from "@shopify/shopify-api/lib/clients/admin/graphql/client";

async function getCustomers(client: GraphqlClient){
    const customers = await client.request(
        `{
            customers(first: 10) {
                edges {
                    node {
                        id
                        displayName
                        email
                    }
                }
            }
        }`
    );

    return customers.data?.customers.edges.map((edge: any) => edge.node);
}



export {
    getCustomers
}