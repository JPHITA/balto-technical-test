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
    createdAt: string,
}

interface DB_customer {
    id?: number,
    shopify_id: number,
    email: string,
    likes_gained: number,
    followers_gained: number,
}

export {
    socialmedia_customer,
    shopify_customer,
    DB_customer
}