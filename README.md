# Twitch Chatbot para Buscar Amigos
Este repositorio contiene el código fuente para un chatbot de Twitch que permite a los usuarios buscar amigos y hacer solicitudes de amistad en Twitch.

## Funcionalidades
El chatbot tiene las siguientes funcionalidades:

* `!buscaramistad`: Los usuarios pueden escribir este comando en el chat para buscar amigos. El chatbot responderá con una lista de usuarios que también están buscando amigos.

* `!proponeramistad <usuario>` : Los usuarios pueden proponer amistad a otro usuario escribiendo este comando seguido del nombre de usuario del usuario al que quieren proponer amistad.

* `!aceptaramistad <usuario>`: Si un usuario recibe una solicitud de amistad, puede aceptarla escribiendo este comando seguido del nombre de usuario del usuario que propuso la amistad.

* `!denegaramistad <usuario>`: Si un usuario recibe una solicitud de amistad, puede rechazarla escribiendo este comando seguido del nombre de usuario del usuario que propuso la amistad.

## Configuración
Para utilizar el chatbot, es necesario crear un archivo environment.js en la raíz del proyecto y configurar las siguientes variables de entorno:

* `password`: El token de autenticación de la cuenta de Twitch. Se puede generar un token en la página de conexión de Twitch.
    
* `username`: El nombre de usuario de la cuenta de Twitch que se utilizará para autenticarse en el chat

## Ejecución
Para ejecutar el chatbot, es necesario tener instalado Node.js.

* Primero, es necesario instalar las dependencias del proyecto ejecutando el siguiente comando en la raíz del proyecto:

``` npm install ```

* Finalmente, es posible ejecutar el chatbot ejecutando el siguiente comando en la raíz del proyecto:

``` npm start ```

## Contribuir

Si quieres contribuir al desarrollo del chatbot, puedes crear un "fork" del repositorio y enviar "pull requests" con tus cambios. Además, si encuentras algún error o tienes alguna sugerencia, puedes abrir un "issue" en el repositorio.

## Contribuidores actuales

<a href = "https://github.com/Xilerth/make-friends-twitch/contributors">
  <img src = "https://contrib.rocks/image?repo=xilerth/make-friends-twitch"/>
</a>


