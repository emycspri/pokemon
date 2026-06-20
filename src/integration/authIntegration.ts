import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const baseURL=process.env.EXPO_PUBLIC_API_URL?`${process.env.EXPO_PUBLIC_API_URL}/api-pokemon/auth/v1`:null;
const api=baseURL?axios.create({baseURL}):null;
export type AuthRequest={username:string,password:string};
export type AuthResponse={token:string;userId:string};
export type StatsResponse={userId:string;username:string;level:number;vitorias:number;derrotas:number};

async function localUsers(){return JSON.parse(await AsyncStorage.getItem('@local_users')||'[]')}
async function saveUsers(v:any){await AsyncStorage.setItem('@local_users',JSON.stringify(v))}
export const register=async(data:AuthRequest):Promise<AuthResponse>=>{
 try{
  if(api){const r=await api.post('/register',data); return r.data;}
 }catch{}
 const users=await localUsers();
 if(users.find((u:any)=>u.username===data.username)) throw new Error('Usuário já existe');
 const user={username:data.username,password:data.password,userId:Date.now().toString(),token:'local-token'};
 users.push(user); await saveUsers(users);
 return {userId:user.userId,token:user.token};
}
export const login=async(data:AuthRequest):Promise<AuthResponse>=>{
 try{
  if(api){const r=await api.post('/login',data); return r.data;}
 }catch{}
 const users=await localUsers();
 const user=users.find((u:any)=>u.username===data.username&&u.password===data.password);
 if(!user) throw new Error('Credenciais inválidas');
 return {userId:user.userId,token:user.token};
}
export const getStats=async(userId:string)=>({userId,username:'Treinador',level:1,vitorias:0,derrotas:0});
