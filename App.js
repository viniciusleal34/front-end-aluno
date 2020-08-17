import React, 
{ 
  useState, 
  useEffect, 
  useRef 
} from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Modal, 
  Image, 
  Alert
} from 'react-native';
import { Camera } from 'expo-camera'
import {FontAwesome} from '@expo/vector-icons'
import * as firebase from 'firebase'
import ApiKeys from './src/config'
import * as Location from 'expo-location';

export default function ProjetoCamera (){
  if(!firebase.apps.length){
    //configuração das credenciais aqui
    firebase.initializeApp(ApiKeys.firebaseConfig)
  }

  const camRef = useRef(null)
  const [hasPermission, setHaspermission] = useState(null);
  const [capturedPhoto, setCaputredphoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [open, setOpen] = useState(false);

  // pedindo permissão inicial para executar as ações
  useEffect(()=>{
    (async () => {
      let { status } = await Location.requestPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
      }
      const estado = await Camera.requestPermissionsAsync();
      setHaspermission(estado.status === 'granted');
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })()

  },[]);

  //Caso as permissões seja negada ou nao seja selecionada nem uma
  if (hasPermission === null){
    return <View/>
  }
  if (hasPermission === false){
    return <Text>Acesso Negado!</Text>
  }

 async function takePicture(){
  if (camRef){
    const data = await camRef.current.takePictureAsync()
    setCaputredphoto(data.uri)

    setOpen(true);
  }
}

  uploadImage = async () => {
   try{
    let date = new Date().getDate();
    let month = new Date().getMonth()+1;
    let year = new Date().getFullYear();
    let data= date+"-"+month+"-"+year;
    let hour= new Date().getHours();
    let minutos = new Date().getMinutes();
    let segundos = new Date().getSeconds();
    let milessimos = new Date().getUTCMilliseconds();
    let name_photo = hour+"-"+minutos+"-"+segundos+"-"+milessimos

    const data_fire= {
      'nome':name_photo,
      'date':data,
      'hour':hour,
      'min':minutos,
      'sec':segundos,
      'latitude':JSON.stringify(location.coords.latitude),
      'longitude':JSON.stringify(location.coords.longitude),

    }
    const db = firebase.database()
    db.ref("users").child(data).push(data_fire)
    const photo= {uri:capturedPhoto}
    const response = await fetch(photo.uri);
    const blob = await response.blob();

    var ref = firebase.storage().ref().child(data+"/"+name_photo+".jpg");
    ref.put(blob);
    setOpen(false)
    return Alert.alert('Enviado com sucesso!')
    }catch(error){
      setOpen(false)
      return Alert.alert('Algo de errado, aconteceu, tente novamente mais tarde!')
    }


  }

    return (
      // safeare Ã© para nao tampar o status bar do iphone
      <SafeAreaView style={styles.container}>

        <Camera
        style={styles.camera}
        ref={camRef}
        type={Camera.Constants.Type.front}

        />
        <TouchableOpacity style={styles.button}
        onPress={takePicture}>
          <FontAwesome name="camera" size={23} color="#FFFF"/>

        </TouchableOpacity>

        { capturedPhoto &&
          <Modal
          animated="slide"
          transparent={false}
          visible={open}
          >
            <View style={styles.model}>
            <TouchableOpacity style={{margin:10}} onPress={ ()=> setOpen(false)}>
              <FontAwesome name="window-close" size={50} color="#FF0000" />
              </TouchableOpacity>
              <Image
              style={styles.image}
              source={{uri:capturedPhoto}}
              />

            </View>
            <TouchableOpacity style={styles.button}
        onPress={uploadImage}>
          <Text style={styles.send}>Enviar</Text>

        </TouchableOpacity>
          </Modal>
        }

      </SafeAreaView>
    )


}

const styles =  StyleSheet.create({
  container:{
    marginTop:30,
    flex:1,
    flexDirection:'column',
    backgroundColor:'#D8D8D8'
  },
  camera:{
    flex:1
  },
  button:{
    justifyContent:'center',
    alignItems:'center',
    backgroundColor: '#000000',
    margin: 10,
    borderRadius: 50,
    height:50,
  },
  send:{
    color:'#fff',
  },
  model:{
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    margin:10
  },
  image:{
    width:'100%',
    height: '90%',

  }
})
