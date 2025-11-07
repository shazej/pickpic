export type Product = {
  name: string;
  price: number;
};

export type Seller = {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  products: Product[];
};

export type Coordinates = {
  lat: number;
  lng: number;
};
