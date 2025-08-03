import { colors } from '@/services/Colors'
import React from 'react'
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native'

export default function LoadingDialog({visible=false,text='Loading..'}:any) {
  return (
    <Modal transparent visible={visible} animationType='fade'>
       
        <View style={[styles.overlay]}>
             <View style={{
            width:120,
            height:120,
            backgroundColor: colors.SECONDARY,
            padding: 20,
            borderRadius: 20,
            alignItems: 'center',
        }}>
            <ActivityIndicator 
            size={'large'}
            color={colors.WHITE}/>
            <Text style={styles.text}>
            {text}
            </Text>
        </View>
         </View>
    </Modal>
  )
}
const styles = StyleSheet.create({
    overlay:{
            flex: 1,
            justifyContent: 'center',   
            alignItems: 'center',
            backgroundColor: '#00000070', 
    },
    text:{
        marginTop:10,
        color:colors.BLACK,
        fontSize: 16,
        fontFamily: 'outfit',
    }
})