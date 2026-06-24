import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import Fontisto from "@expo/vector-icons/Fontisto";
import i18n, { changeLanguage } from "../i18n";
import { Languages } from "../localizacion";
import { API_REAL_URL, API_URL } from "../config/apiUrl";

const normalizarBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

const construirUrlApi = (baseUrl: string, ruta: string) => `${normalizarBaseUrl(baseUrl)}${ruta}`;

const obtenerBasesApiLogin = () => {
  const bases = [API_URL];

  if (Platform.OS === "web") {
    bases.push(API_REAL_URL);
  }

  return Array.from(new Set(bases.map(normalizarBaseUrl).filter(Boolean)));
};

const consultarLogin = async (correoSeguro: string, passwordSeguro: string) => {
  const ruta = `/Usuario/usuario_Login/${correoSeguro}/${passwordSeguro}`;
  let ultimoError: unknown;

  for (const baseUrl of obtenerBasesApiLogin()) {
    try {
      const response = await fetch(construirUrlApi(baseUrl, ruta));

      if (!response.ok) {
        ultimoError = new Error(`HTTP ${response.status}`);
        continue;
      }

      return response.json();
    } catch (error) {
      ultimoError = error;
    }
  }

  throw ultimoError instanceof Error ? ultimoError : new Error("No se pudo conectar con la API.");
};

const actualizarEstadosLotes = async () => {
  for (const baseUrl of obtenerBasesApiLogin()) {
    try {
      const response = await fetch(construirUrlApi(baseUrl, "/Lote/lote_ActualizarEstadoMasivo"), {
        method: "POST",
      });

      if (response.ok) return;
    } catch (error) {
      console.warn("No se pudo actualizar estados de lotes desde login:", error);
    }
  }
};

const Login = ({ navigation }: { navigation: any }) => {
  const [Correo, setEmail] = useState("");
  const [Contraseña, setPassword] = useState("");
  const [loading, setloading] = useState(false);
  const [icon, seticon] = useState(false);
  const [language, setlanguage] = useState<Languages>("es");
  const [recordarme, setRecordarme] = useState(false);
  const { width } = useWindowDimensions();
  const logoEntry = useRef(new Animated.Value(0)).current;
  const formEntry = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(0)).current;

  const isDesktop = Platform.OS === "web" && width >= 900;

  // ATAMAINE: Animacion mobile premium; en PC no altera el layout ni la experiencia actual.
  useEffect(() => {
    if (isDesktop) {
      logoEntry.setValue(1);
      formEntry.setValue(1);
      logoPulse.setValue(1);
      return;
    }

    logoEntry.setValue(0);
    formEntry.setValue(0);

    Animated.sequence([
      Animated.timing(logoEntry, {
        toValue: 1,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formEntry, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    return () => pulse.stop();
  }, [formEntry, isDesktop, logoEntry, logoPulse]);

  // ATAMAINE: Conserva la misma autenticacion real; solo cambiamos la superficie visual del login.
  const handleLogin = async () => {
    if (!Correo.trim() || !Contraseña.trim()) {
      alert("Por favor, complete todos los campos");
      return;
    }

    setloading(true);

    try {
      const correoSeguro = encodeURIComponent(Correo.trim());
      const passwordSeguro = encodeURIComponent(Contraseña.trim());

      const data = await consultarLogin(correoSeguro, passwordSeguro);

      if (data && data.length > 0) {
        const usuario = data[0];
        const idUsuario = usuario.IdUsuario || usuario.idUsuario || usuario.Id || usuario.id;

        void actualizarEstadosLotes();

        navigation.replace("MainTabs", {
          rol: usuario.TipoUsuario,
          nombre: usuario.Nombre,
          idUsuario,
        });
        console.log("Usuario autenticado:", { nombre: usuario.Nombre, rol: usuario.TipoUsuario, idUsuario });
      } else {
        alert("Usuario o contraseña incorrectos");
      }
    } catch (error) {
      console.error("Error al iniciar sesion:", error);
      alert("Error al iniciar sesión. Verifique que la API web esté activa.");
    } finally {
      setloading(false);
    }
  };

  const handlechangeLanguage = () => {
    const lang: Languages = language === "es" ? "en" : "es";
    changeLanguage(lang);
    setlanguage(lang);
  };

  return (
    <LinearGradient
      colors={isDesktop ? ["#f8fafc", "#eef8f6"] : ["#fbfffd", "#eefbf7", "#dff8f0"]}
      style={styles.contenedor}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop ? styles.scrollContentDesktop : styles.scrollContentMobile,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.shell, isDesktop ? styles.shellDesktop : styles.shellMobile]}>
          {!isDesktop ? (
            <>
              <View style={styles.mobileGlowTop} />
              <View style={styles.mobileGlowBottom} />
            </>
          ) : null}

          {isDesktop ? (
            <LinearGradient
              colors={["#079487", "#058374", "#0c716c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brandPanel}
            >
              <View style={styles.brandGlowOne} />
              <View style={styles.brandGlowTwo} />

              <View style={styles.brandHeader}>
                <Image source={require("../img/logoLote.webp")} style={styles.brandLogo} />
                <View>
                  <Text style={styles.brandName}>
                    TuLote<Text style={styles.brandNameStrong}>Seguro</Text>
                  </Text>
                  <Text style={styles.brandTagline}>Compra tu futuro, hoy.</Text>
                </View>
              </View>

              <View style={styles.brandMessage}>
                <Text style={styles.brandTitle}>Encuentra el lote ideal para ti</Text>
                <Text style={styles.brandSubtitle}>
                  La plataforma confiable para comprar lotes de forma segura, facil y transparente.
                </Text>
              </View>

              <View style={styles.landVisualWrap}>
                <View style={styles.landShadow} />
                <Image source={require("../img/logoLote.webp")} style={styles.landVisual} />
              </View>
            </LinearGradient>
          ) : null}

          <View style={[styles.loginPanel, isDesktop ? styles.loginPanelDesktop : styles.loginPanelMobile]}>
            <View style={styles.languageRow}>
              <TouchableOpacity style={styles.idioma} onPress={handlechangeLanguage} activeOpacity={0.85}>
                <Fontisto name="world-o" size={19} color="#111827" />
                <Text style={styles.languageText}>{language.toUpperCase()}</Text>
                <Feather name="chevron-down" size={16} color="#111827" />
              </TouchableOpacity>
            </View>

            {!isDesktop ? (
              <View style={styles.mobileBrand}>
                <Animated.View
                  style={[
                    styles.mobileLogoFrame,
                    {
                      opacity: logoEntry,
                      transform: [
                        {
                          translateY: logoEntry.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-28, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Animated.Image
                    source={require("../img/logoLote.webp")}
                    style={[
                      styles.logoMobile,
                      {
                        opacity: logoPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.72, 1],
                        }),
                        transform: [
                          {
                            scale: logoPulse.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.97, 1.04],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </Animated.View>
                <Text style={styles.mobileBrandTitle}>
                  TuLote<Text style={styles.mobileBrandStrong}>Seguro</Text>
                </Text>
                <Text style={styles.mobileBrandSubtitle}>Compra tu futuro, hoy.</Text>
              </View>
            ) : null}

            <Animated.View
              style={[
                !isDesktop && {
                  opacity: formEntry,
                  transform: [
                    {
                      translateY: formEntry.interpolate({
                        inputRange: [0, 1],
                        outputRange: [36, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.formHeader, !isDesktop && styles.formHeaderMobile]}>
                <Text style={[styles.title, !isDesktop && styles.titleMobile]}>{i18n.t("title")}</Text>
                <Text style={[styles.subtitle, !isDesktop && styles.subtitleMobile]}>
                  Bienvenido de vuelta, ingresa tus datos para continuar.
                </Text>
              </View>

              <View style={[styles.fieldGroup, !isDesktop && styles.fieldGroupMobile]}>
                <Text style={[styles.label, !isDesktop && styles.labelMobile]}>Correo electrónico</Text>
                <View style={[styles.textInput, !isDesktop && styles.textInputMobile]}>
                  <View style={styles.inputIconBadge}>
                    <Feather name="mail" size={18} color="#087c72" />
                  </View>
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    style={styles.inputcontrol}
                    placeholder={i18n.t("Email")}
                    placeholderTextColor="#9ca3af"
                    value={Correo}
                    onChangeText={(text) => setEmail(text)}
                  />
                </View>
              </View>

              <View style={[styles.fieldGroup, !isDesktop && styles.fieldGroupMobile]}>
                <Text style={[styles.label, !isDesktop && styles.labelMobile]}>Contraseña</Text>
                <View style={[styles.textInput, !isDesktop && styles.textInputMobile]}>
                  <View style={styles.inputIconBadge}>
                    <Feather name="lock" size={18} color="#087c72" />
                  </View>
                  <TextInput
                    secureTextEntry={!icon}
                    style={styles.inputcontrol}
                    placeholder={i18n.t("pswd")}
                    placeholderTextColor="#9ca3af"
                    value={Contraseña}
                    onChangeText={(text) => setPassword(text)}
                  />
                  <TouchableOpacity onPress={() => seticon(!icon)} style={styles.eyeButton} activeOpacity={0.75}>
                    <AntDesign name={icon ? "eye" : "eye-invisible"} size={21} color="#475569" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.optionsRow, !isDesktop && styles.optionsRowMobile]}>
                <TouchableOpacity
                  style={styles.rememberTouch}
                  onPress={() => setRecordarme((value) => !value)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, recordarme && styles.checkboxActive]}>
                    {recordarme ? <Feather name="check" size={13} color="#ffffff" /> : null}
                  </View>
                  <Text style={styles.rememberText}>Recordarme</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigation.replace("loginCambiarContraseña")}
                >
                  <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleLogin}
                activeOpacity={0.9}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#14b8a6", "#0f8f83", "#086b63"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.btnGradient, !isDesktop && styles.btnGradientMobile]}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={[styles.btnLabel, !isDesktop && styles.btnLabelMobile]}>
                      {i18n.t("btnLogin")}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={[styles.dividerRow, !isDesktop && styles.dividerRowMobile]}>
                <View style={styles.dividerLine} />
                <Text style={[styles.dividerText, !isDesktop && styles.dividerTextMobile]}>acceso seguro</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.btnR}
                onPress={() => navigation.replace("loginRegistrate")}
                activeOpacity={0.75}
              >
                <Text style={[styles.registerText, !isDesktop && styles.registerTextMobile]}>
                  ¿No tienes una cuenta?{" "}
                </Text>
                <Text style={[styles.registerLink, !isDesktop && styles.registerLinkMobile]}>
                  Regístrate aquí
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnCambiar}
                activeOpacity={0.7}
                onPress={() => navigation.replace("loginCambiarContraseña")}
              >
                <Text style={[styles.supportText, !isDesktop && styles.supportTextMobile]}>
                  {i18n.t("suport")}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    height: "100vh" as any,
    overflow: "hidden",
  },
  // ATAMAINE: En web el login necesita scroll real para subir y bajar cuando la ventana es baja.
  scroll: {
    flex: 1,
    width: "100%",
    height: "100vh" as any,
    maxHeight: "100vh" as any,
    overflow: "scroll",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  } as any,
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContentDesktop: {
    padding: 24,
    minHeight: "100vh" as any,
    paddingBottom: 56,
  },
  scrollContentMobile: {
    paddingHorizontal: 14,
    paddingTop: 14,
    minHeight: "100vh" as any,
    paddingBottom: 28,
  },
  shell: {
    width: "100%",
  },
  shellDesktop: {
    maxWidth: 1180,
    minHeight: 700,
    flexDirection: "row",
    gap: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  shellMobile: {
    maxWidth: 520,
    alignSelf: "center",
    position: "relative",
  },
  mobileGlowTop: {
    position: "absolute",
    top: -90,
    right: -70,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(20, 184, 166, 0.16)",
  },
  mobileGlowBottom: {
    position: "absolute",
    bottom: -85,
    left: -75,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(6, 148, 136, 0.12)",
  },
  brandPanel: {
    flex: 1,
    minHeight: 680,
    borderRadius: 0,
    padding: 64,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  brandGlowOne: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: -220,
    right: -130,
  },
  brandGlowTwo: {
    position: "absolute",
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: "rgba(0,0,0,0.07)",
    top: -140,
    left: -120,
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
  },
  brandLogo: {
    width: 88,
    height: 88,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.22)",
  },
  brandName: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "400",
    letterSpacing: 0,
  },
  brandNameStrong: {
    fontWeight: "900",
  },
  brandTagline: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 19,
    fontWeight: "600",
    marginTop: 8,
  },
  brandMessage: {
    maxWidth: 470,
    zIndex: 1,
  },
  brandTitle: {
    color: "#ffffff",
    fontSize: 38,
    lineHeight: 46,
    fontWeight: "900",
    marginBottom: 24,
    letterSpacing: 0,
  },
  brandSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 19,
    lineHeight: 30,
    fontWeight: "600",
  },
  landVisualWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 230,
  },
  landShadow: {
    position: "absolute",
    bottom: 10,
    width: 320,
    height: 52,
    borderRadius: 160,
    backgroundColor: "rgba(0,0,0,0.22)",
    transform: [{ scaleX: 1.25 }],
  },
  landVisual: {
    width: 260,
    height: 260,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  loginPanel: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.12,
    shadowRadius: 42,
    elevation: 12,
  },
  loginPanelDesktop: {
    flex: 1,
    maxWidth: 560,
    borderRadius: 18,
    paddingVertical: 54,
    paddingHorizontal: 48,
  },
  loginPanelMobile: {
    borderRadius: 26,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 18,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: "rgba(6, 148, 136, 0.12)",
    shadowColor: "#087c72",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
  },
  languageRow: {
    alignItems: "flex-end",
    marginBottom: 18,
  },
  idioma: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  languageText: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "700",
  },
  mobileBrand: {
    alignItems: "center",
    marginBottom: 18,
  },
  mobileLogoFrame: {
    width: 92,
    height: 92,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "rgba(20, 184, 166, 0.22)",
    shadowColor: "#0f766e",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 15,
  },
  logoMobile: {
    width: 82,
    height: 82,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#09caba",
  },
  mobileBrandTitle: {
    fontSize: 23,
    fontWeight: "500",
    color: "#0f172a",
  },
  mobileBrandStrong: {
    fontWeight: "900",
    color: "#069488",
  },
  mobileBrandSubtitle: {
    marginTop: 3,
    fontSize: 12.5,
    fontWeight: "600",
    color: "#475569",
  },
  formHeader: {
    marginBottom: 34,
  },
  formHeaderMobile: {
    marginBottom: 18,
  },
  title: {
    color: "#202124",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: 0,
  },
  titleMobile: {
    fontSize: 30,
    lineHeight: 35,
    color: "#111827",
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "500",
    marginTop: 10,
  },
  subtitleMobile: {
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 6,
    color: "#64748b",
  },
  fieldGroup: {
    marginBottom: 22,
  },
  fieldGroupMobile: {
    marginBottom: 14,
  },
  label: {
    color: "#202124",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  labelMobile: {
    fontSize: 13,
    marginBottom: 7,
    color: "#111827",
  },
  textInput: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#d9dee7",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    gap: 12,
  },
  textInputMobile: {
    minHeight: 48,
    borderRadius: 15,
    borderColor: "#d5e7e3",
    backgroundColor: "#fbfffe",
    paddingHorizontal: 9,
    shadowColor: "#0f766e",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  inputIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8fff8",
  },
  inputcontrol: {
    flex: 1,
    minHeight: 50,
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    outlineStyle: "none" as any,
  },
  eyeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 28,
    flexWrap: "wrap",
  },
  optionsRowMobile: {
    marginBottom: 18,
    gap: 8,
  },
  rememberTouch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#26b8a6",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#069488",
    borderColor: "#069488",
  },
  rememberText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "600",
  },
  forgotText: {
    color: "#079487",
    fontSize: 13,
    fontWeight: "700",
  },
  btn: {
    borderRadius: 9,
    overflow: "hidden",
    shadowColor: "#069488",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 5,
  },
  btnDisabled: {
    opacity: 0.68,
  },
  btnGradient: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGradientMobile: {
    height: 50,
    borderLeftWidth: 6,
    borderLeftColor: "rgba(255,255,255,0.32)",
  },
  btnLabel: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 17,
  },
  btnLabelMobile: {
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginVertical: 34,
  },
  dividerRowMobile: {
    marginVertical: 22,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },
  dividerTextMobile: {
    fontSize: 12.5,
  },
  btnR: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 3,
  },
  registerText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "500",
  },
  registerTextMobile: {
    fontSize: 14,
  },
  registerLink: {
    color: "#079487",
    fontSize: 16,
    fontWeight: "900",
  },
  registerLinkMobile: {
    fontSize: 14,
  },
  btnCambiar: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  supportText: {
    color: "#8aa09d",
    fontSize: 13,
    fontWeight: "700",
  },
  supportTextMobile: {
    fontSize: 12.5,
  },
});

export default Login;
