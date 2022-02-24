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

      const { data } = await api.get(`products/${productId}`);
      if(data === undefined) {
        throw new Error();
      }

      const { data: stock }  = await api.get(`/stock/${productId}`);

      const productAlreadyExists = cart.some(product => product.id === productId);
      
      if(!productAlreadyExists) {
        const products = [...cart, {
          ...data,
          amount: 1
        }];

        setCart(products);

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(products));

        return;
      }

      const product = cart.find(product => product.id === productId);

      if(product?.amount === stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        const newCart = cart.map(product => {
          if(product.id === productId) {
            product.amount++;
          }
  
          return product;
        });        

        setCart(newCart);
  
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const dataProduct = cart.some(product => product.id === productId);
      if(!dataProduct) {
        throw new Error();
      }

      const newCart = cart.filter(product => product.id !== productId);

      setCart(newCart);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) {
        throw new Error();
      }

      const { data: stock }  = await api.get(`/stock/${productId}`);

      if(amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        const newCart = cart.map(product => {
          if(product.id === productId) {
            return {
              id: product.id,
              title: product.title,
              price: product.price,
              image: product.image,
              amount
            }
          } else {
            return product;
          }
        });
  
        setCart(newCart);
  
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
