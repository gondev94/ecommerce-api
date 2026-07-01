export interface Address {
    id?: string;
    userId: string;
    addressLine1: string;
    addressLine2?: string;
    descriptionAddress?: string; // "casa", "trabajo", "otro", etc.
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
    isDefault: boolean;
    createdAt?: Date;
}