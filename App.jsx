import { Text, View } from 'react-native';
import AppMainStack from '../OrchidService/src/stacks/AppMainStack';
import FlashMessage from 'react-native-flash-message';
import { showMessage } from 'react-native-flash-message';
function App() {
  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <FlashMessage position="top" />
      <AppMainStack />
    </View>
  );
}

export default App;
