interface socialmedia_customer {
    customer_shopify_id: number,
    likes_gained_today: number,
    followers_gained_today: number,
    email?: string,
}

interface shopify_customer {
    id: string,
    displayName: string,
    email: string, 
}

export {
    socialmedia_customer,
    shopify_customer
}