import { Platform, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
const isWeb = Platform.OS === 'web';
export const styles = StyleSheet.create({
input:{
width:'100%',height:isWeb?52:48,borderRadius:isWeb?12:10,borderWidth:1.5,
borderColor:Colors.border,backgroundColor:Colors.white,padding:14,
fontSize:isWeb?15:14,color:Colors.text,
...Platform.select({web:{outlineColor:Colors.primary} as any}),
}
});