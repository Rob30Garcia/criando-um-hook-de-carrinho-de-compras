import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');     

    if (storagedCart) {      
      return JSON.parse(storagedCart);  
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {       
      const productAlreadyExists = cart.find(product => product.id === productId);
     
      if(productAlreadyExists) {
        const { data } = await api.get(`/stock/${productId}`);

        const amount = productAlreadyExists.amount;        

        if(amount === data.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        updateProductAmount({ productId, amount });
        return;
      } 

      const { data } = await api.get(`products/${productId}`);
      
      const products = [...cart, {
        ...data,
        amount: 1
      }];

      setCart(products);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(products));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data } = await api.get(`/stock/${productId}`);

      if(amount === data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
      }

      const newCart = cart.map(product => {
        if(product.id === productId) {
          return {
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            amount: product.amount + 1
          }
        } else {
          return product;
        }
      });

      setCart(newCart);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
