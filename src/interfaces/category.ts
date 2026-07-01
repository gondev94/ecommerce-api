export interface Category { 
    id?: string;
    name: string;
    description?: string;
    imageUrl?: string;
    parentId?: string;
    isActive?: boolean;
    order?: number;
    createdAt?: Date;
    updatedAt?: Date;
}