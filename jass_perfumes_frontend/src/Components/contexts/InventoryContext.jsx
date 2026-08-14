// // src/contexts/InventoryContext.js
// import { createContext, useContext, useState, useEffect } from 'react';
// import axios from 'axios';

// const InventoryContext = createContext();

// export const InventoryProvider = ({ children }) => {
//   const [inventory, setInventory] = useState([]);
//   const [grns, setGrns] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchInventoryData = async () => {
//     try {
//       const [itemsRes, grnsRes] = await Promise.all([
//         axios.get(`${import.meta.env.VITE_API_URL}/items/get-items`),
//         axios.get(`${import.meta.env.VITE_API_URL}/grn/get-grns`)
//       ]);
      
//       setInventory(itemsRes.data || []);
//       setGrns(grnsRes.data?.data || grnsRes.data || []);
//     } catch (error) {
//       console.error("Error fetching inventory:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const calculateStock = (itemName) => {
//     return grns.reduce((sum, grn) => {
//       const itemInGrn = grn.items?.find(i => i.name === itemName);
//       return sum + (itemInGrn?.qty || 0);
//     }, 0);
//   };

//   useEffect(() => {
//     fetchInventoryData();
//   }, []);

//   return (
//     <InventoryContext.Provider value={{ inventory, grns, loading, calculateStock, refresh: fetchInventoryData }}>
//       {children}
//     </InventoryContext.Provider>
//   );
// };

// export const useInventory = () => useContext(InventoryContext);