export interface Cart {
    _id?: number;
    userId: number;
    cartId: number;
    products: {
        productId: string;
        quantity: number;
        price: number;
        total: number;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
}