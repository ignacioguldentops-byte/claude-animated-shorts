# "La servilleta": one clip per clause, Alvaro at a flat +12 % (the Maradona-hair voice). PAUSE = silence after each clip (s).
R = "+12%"
T = [
 "Una servilleta de papel se vendió por casi un millón de dólares.",                       # 0 hook
 "Pere es camarero en un club de tenis de Barcelona,",                                     # 1
 "y en su bar nunca pasa nada.",                                                           # 2
 "Hasta que un día de diciembre del año dos mil, se sientan en su mesa tres señores muy serios.",  # 3
 "Uno es el director deportivo del Barça.",                                                # 4
 "Los otros dos le hablan de un niño argentino de trece años que juega como nadie.",       # 5
 "Pero mide como un niño de nueve,",                                                       # 6
 "y su tratamiento para crecer cuesta una fortuna.",                                       # 7
 "El Barça lleva semanas dudando,",                                                        # 8
 "y los agentes amenazan con llevárselo a otro club.",                                     # 9
 "Entonces el director pide un papel.",                                                    # 10
 "Y no hay papel.",                                                                        # 11
 "Pere mira a la izquierda.",                                                              # 12
 "A la derecha.",                                                                          # 13
 "Y le da una servilleta.",                                                                # 14
 "En ella, el director se compromete a fichar a Lionel Messi.",                            # 15
 "Y firman los tres.",                                                                     # 16
 "Espera. ¿Un fichaje en una servilleta?",                                                 # 17
 "Verás: gracias a esa servilleta, el Barça se quedó al niño y le pagó el tratamiento.",   # 18
 "Y ese niño ganó ocho Balones de Oro.",                                                   # 19
 "Y un Mundial.",                                                                          # 20
 "Veinticuatro años después, la servilleta se subastó en Londres.",                        # 21
 "¿Y Pere? Sigue en su bar.",                                                              # 22
 "Pero ahora guarda todas las servilletas.",                                               # 23
]
LINES = [(t, R) for t in T]
PAUSE = [0.55, 0.15, 0.45, 0.4, 0.4, 0.4, 0.15, 0.4, 0.15, 0.45, 0.25, 0.4, 0.25, 0.25, 0.45, 0.25, 0.5, 0.45, 0.35, 0.3, 0.5, 0.45, 0.25, 0.0]
assert len(PAUSE) == len(T)
