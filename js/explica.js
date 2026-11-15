// Explicações do guia. SABER_PT: o conceito antes da decisão (português).
// EXPLICA_EN: [conceito antes da decisão, passo 1, passo 2, passo 3, porque falha a opção arriscada] (inglês).
export const SABER_PT = {
  desvio:
    "Uma nave viaja sem motor ligado, por um caminho planeado chamado corredor. Um erro pequeno cresce com a distância: corrigir cedo custa pouco propulsante, corrigir tarde custa muito.",
  impacto:
    "Os painéis solares transformam luz em electricidade e a bateria guarda-a. Se um painel produz menos, a nave gasta mais do que ganha e a bateria esvazia.",
  oxigenio:
    "O ar da nave está em circuitos fechados com válvulas. Uma fuga deixa sair gás para o espaço. Enquanto a fuga estiver aberta, todo o gás que lá puseres também sai.",
  co2: "Ao respirar gastamos oxigénio e produzimos dióxido de carbono (CO₂). São dois sistemas diferentes: um fornece oxigénio, outro retira o CO₂ com filtros.",
  radiacao:
    "O Sol lança por vezes partículas muito energéticas. A dose de radiação soma-se com o tempo e não se pode retirar. Paredes grossas e água travam parte dela.",
  atraso:
    "O rádio viaja à velocidade da luz, mas o espaço é enorme: o sinal demora a chegar à Terra e a resposta demora a voltar. Por isso a tripulação tem procedimentos que pode fazer sozinha.",
  sensor_estrelas:
    "A nave sabe para onde aponta comparando estrelas conhecidas com um mapa. Se um sensor estiver errado, a nave pensa que aponta para um lado e aponta para outro.",
  refrigeracao:
    "No espaço não há ar para levar o calor embora. Os equipamentos aquecem e precisam de um sistema de arrefecimento. Mais potência significa mais calor.",
  reciclagem_agua:
    "A água a bordo é reciclada: é tratada e depois analisada. Só se bebe água que passou no controlo; o resto fica separado.",
  rochas:
    "Para pousar é preciso terreno plano e sem pedras. Pairar à procura de sítio gasta propulsante muito depressa, por isso escolhe-se uma alternativa já estudada.",
  sombra:
    "Na Lua não há ar para espalhar a luz: ou há Sol directo ou sombra total. Uma elevação pode tapar os painéis e a base fica só com a bateria.",
  relevo:
    "O rádio viaja em linha recta. Se houver um monte entre ti e a antena, o sinal não passa. Chama-se perder a linha de visão.",
  rover_lua:
    "A poeira lunar é fina e cortante como vidro moído. Os guarda-lamas impedem que as rodas a atirem para cima do rover e dos fatos.",
  junta:
    "As juntas vedam as ligações para o ar não fugir. Um grão de poeira abrasiva preso lá dentro risca a vedação quando se aperta.",
  gelo_lua:
    "Há gelo em crateras onde o Sol nunca chega. São sítios muito frios e escuros. A bateria tem de chegar para ir e para voltar.",
  poeira_antecamara:
    "A antecâmara é a sala entre o exterior e o habitat. Serve para trocar de fato e limpar a poeira antes de entrar.",
  oscilacao_termica:
    "Na Lua a temperatura muda muito entre o Sol e a sombra. Alguns instrumentos estragam-se com o frio e precisam de aquecimento primeiro.",
  retransmissor:
    "Um retransmissor é uma antena num sítio alto ou em órbita que recebe o sinal e volta a enviá-lo, contornando os montes.",
  pouso_marte:
    "Pousa-se onde é seguro, mesmo que a carga fique longe. Depois é preciso estudar o terreno e marcar um caminho antes de mover coisas pesadas.",
  tempestade:
    "Marte tem ar e vento. As tempestades levantam poeira que tapa o Sol durante dias, e os painéis solares quase deixam de produzir.",
  frio: "As noites em Marte são geladas. O ar fino não guarda calor. O aquecimento é o que mantém os sensores e as baterias vivos durante a noite.",
  conjuncao:
    "Por vezes o Sol fica entre Marte e a Terra e o rádio não passa durante semanas. A base tem de trabalhar sozinha nesse período.",
  gelo_marte:
    "Os mapas mostram onde é provável haver gelo debaixo do solo. Provável não é certo: só depois de confirmar, extrair e tratar é que é água para beber.",
  roda_marte:
    "As rodas dos rovers são finas para serem leves. As pedras afiadas de Marte furam-nas. Um caminho mais comprido em terreno macio poupa as rodas.",
  painel_marte:
    "Mesmo com céu limpo, a poeira que assentou em cima do painel faz sombra às células solares. O painel precisa de ser limpo.",
  amostra_marte:
    "Uma amostra só tem valor científico se soubermos de onde veio. Por isso cada recipiente tem uma etiqueta e não se misturam.",
  abrigo_marte:
    "Marte não tem campo magnético forte nem ar espesso para travar as partículas do Sol. Durante um alerta, o sítio mais seguro é o abrigo coberto de solo.",
};
export const EXPLICA_EN = {
  desvio: [
    "A spacecraft coasts with its engine off along a planned path called a corridor. A small error grows with distance: fixing it early costs little propellant, fixing it late costs a lot.",
    "Measure the position of the ship against the navigation corridor.",
    "Do a small correction burn now.",
    "Confirm the predicted arrival is back inside the corridor.",
    "The later you correct, the bigger the manoeuvre and the more propellant it burns.",
  ],
  impacto: [
    "Solar panels turn light into electricity and the battery stores it. If a panel makes less, the ship spends more than it earns and the battery drains.",
    "See how much less the damaged panel is producing.",
    "Switch off the loads that are not essential.",
    "Stabilise the battery with life support still on.",
    "Keeping the experiments on drains the battery while the panel makes less.",
  ],
  oxigenio: [
    "The air of the ship runs in closed circuits with valves. A leak lets gas escape to space. While the leak is open, any gas you add escapes too.",
    "Find the compartment where pressure is dropping.",
    "Close the valve to isolate the leak.",
    "Connect the intact reserve to the circuit.",
    "Feeding more oxygen into a leaking circuit only loses more oxygen.",
  ],
  co2: [
    "When we breathe we use oxygen and make carbon dioxide (CO₂). They are two different systems: one supplies oxygen, the other removes CO₂ with filters.",
    "Notice that pressure is normal but CO₂ is rising.",
    "Inspect the system that removes CO₂.",
    "Change the filter and watch the reading go down.",
    "Adding oxygen does not take the CO₂ away: they are two different systems.",
  ],
  radiacao: [
    "The Sun sometimes throws out very energetic particles. Radiation dose adds up over time and cannot be taken back. Thick walls and water stop part of it.",
    "Confirm the solar particle alert.",
    "Take the whole crew to the shielded shelter.",
    "Wait for the readings to drop before leaving.",
    "Every minute outside the shelter adds exposure that can never be removed.",
  ],
  atraso: [
    "Radio travels at the speed of light, but space is huge: the signal takes time to reach Earth and the answer takes time to come back. So the crew has procedures it can run alone.",
    "Understand that the signal takes time to go and return.",
    "Open the local procedure that is already authorised.",
    "Run it and send the report to Earth.",
    "Waiting for Earth uses up the time the team has to react.",
  ],
  sensor_estrelas: [
    "The ship knows where it points by comparing known stars with a map. If one sensor is wrong, the ship thinks it points one way and really points another.",
    "Compare the star tracker with the position of the Sun.",
    "Find the sensor that is wrong.",
    "Realign the ship before firing the engine.",
    "A burn with the ship pointing the wrong way pushes it off course.",
  ],
  refrigeracao: [
    "In space there is no air to carry heat away. Equipment heats up and needs a cooling system. More power means more heat.",
    "See which module is heating up.",
    "Reduce the load of that module.",
    "Inspect the cooling before switching it back on.",
    "More power gives more heat: the module shuts itself down to protect itself.",
  ],
  reciclagem_agua: [
    "Water on board is recycled: it is treated and then tested. You only drink water that passed the test; the rest is kept apart.",
    "Set aside the batch that has not passed the test yet.",
    "Use the reserve of water that is already verified.",
    "Repeat the treatment and test the batch again.",
    "Handing out unverified water may force you to throw the whole batch away.",
  ],
  rochas: [
    "To land you need flat ground with no boulders. Hovering while you look for a spot burns propellant very fast, so you pick an alternative studied in advance.",
    "See that the planned spot has rocks.",
    "Choose a flat alternative within reach.",
    "Descend with a propellant margin.",
    "Hovering above the rocks burns propellant without solving the problem.",
  ],
  sombra: [
    "On the Moon there is no air to scatter light: it is either direct Sun or total shadow. A hill can cover the panels and leave the base on battery only.",
    "Predict when the terrain will block the Sun.",
    "Save power for heating and life support.",
    "Switch off the workshop and the lab until the light is back.",
    "With the panels in shadow, the workshop and the lab drain the battery.",
  ],
  relevo: [
    "Radio travels in a straight line. If there is a hill between you and the antenna, the signal does not get through. This is called losing line of sight.",
    "Notice that the hill is blocking the radio.",
    "Go back to the last point that had signal.",
    "Restore contact and replan the path.",
    "Going on without signal takes the team away from the last contact point.",
  ],
  rover_lua: [
    "Moon dust is fine and sharp like ground glass. Fenders stop the wheels from throwing it over the rover and the suits.",
    "Stop the rover.",
    "Check the damaged fender.",
    "Repair it with spare parts before going on.",
    "Even slowly, the wheel keeps throwing dust onto the vehicle.",
  ],
  junta: [
    "Seals close the joints so that air cannot escape. A grain of abrasive dust trapped inside scratches the seal when you tighten it.",
    "Do not force the connection.",
    "Clean the dust off the joint.",
    "Test the seal before using it.",
    "Tightening with dust inside scratches the seal and ruins the joint.",
  ],
  gelo_lua: [
    "There is ice in craters the Sun never reaches. They are very cold and dark. The battery must be enough to go and to come back.",
    "Work out the energy for the trip there and back.",
    "Reserve the battery for the return.",
    "Prospect only as far as the margin allows.",
    "Spending the return battery to reach the ice leaves the team with no way back.",
  ],
  poeira_antecamara: [
    "The airlock is the room between outside and the habitat. It is where you change suits and clean off the dust before going in.",
    "Stop in the airlock.",
    "Clean boots and suits before entering.",
    "Only then open the habitat door.",
    "Moon dust is abrasive: inside the habitat it wears down seals and equipment.",
  ],
  oscilacao_termica: [
    "On the Moon the temperature swings a lot between Sun and shadow. Some instruments break in the cold and need heating first.",
    "See which instrument is getting cold.",
    "Reserve power for that critical instrument.",
    "Switch off the secondary experiments.",
    "Sharing the power between everything leaves the critical instrument short.",
  ],
  retransmissor: [
    "A relay is an antenna on high ground or in orbit that receives the signal and sends it on, getting around the hills.",
    "See that the place has no line of sight.",
    "Schedule the pass of the relay.",
    "Communicate through it at the right time.",
    "Transmitting straight through the terrain does not reach the base.",
  ],
  pouso_marte: [
    "You land where it is safe, even if the cargo ends up far away. Then you must study the ground and mark a path before moving heavy things.",
    "Accept the safe landing, even far from the cargo.",
    "Study the ground between the ship and the cargo.",
    "Mark and confirm a route before moving.",
    "Moving the cargo without a marked route wastes time on unknown ground.",
  ],
  tempestade: [
    "Mars has air and wind. Storms lift dust that covers the Sun for days, and the solar panels almost stop producing.",
    "Watch the panel output falling.",
    "Keep only the essential systems on.",
    "Wait for the dust to settle.",
    "Dust cuts the light: carrying on with the work spends the reserve.",
  ],
  frio: [
    "Nights on Mars are freezing. The thin air does not hold heat. Heating is what keeps the sensors and batteries alive through the night.",
    "Read the forecast for the night.",
    "Reserve power for heating.",
    "Postpone the experiment to the next day.",
    "Without heating, the sensors reboot during the night.",
  ],
  conjuncao: [
    "Sometimes the Sun sits between Mars and Earth and radio cannot get through for weeks. The base has to work on its own during that time.",
    "Know that the Sun will be between Mars and Earth.",
    "Prepare local tasks and procedures.",
    "Work autonomously until the link returns.",
    "Saving the decisions for later leaves tasks stuck with no answer.",
  ],
  gelo_marte: [
    "Maps show where ice under the ground is likely. Likely is not certain: only after confirming, extracting and treating it is it drinking water.",
    'Treat the ice as "probable", not as water.',
    "Confirm it with a sample.",
    "Keep using the water you brought.",
    "Spending the reserve while counting on unconfirmed ice leaves water below plan.",
  ],
  roda_marte: [
    "Rover wheels are thin to be light. The sharp rocks of Mars puncture them. A longer path on soft ground saves the wheels.",
    "Look at the wear on the wheels.",
    "Compare the short path with the safe one.",
    "Follow the ground that spares the wheels.",
    "The short way crosses sharp rock and ruins the wheels.",
  ],
  painel_marte: [
    "Even with a clear sky, dust that settled on the panel shades the solar cells. The panel needs cleaning.",
    "Notice the sky is clear but the panel makes little power.",
    "Inspect the dust on it.",
    "Clean the panel and manage the energy.",
    "Restarting everything with a dirty panel uses more than it generates.",
  ],
  amostra_marte: [
    "A sample only has scientific value if we know where it came from. So each container has a label and they are never mixed.",
    "Stop the analysis.",
    "Isolate each container.",
    "Confirm the origin record of each sample.",
    "Mixing samples erases where each one came from: the science is lost.",
  ],
  abrigo_marte: [
    "Mars has no strong magnetic field and no thick air to stop particles from the Sun. During an alert, the safest place is the shelter covered with soil.",
    "Receive the alert before going out.",
    "Postpone the EVA.",
    "Protect the team in the shelter until it passes.",
    "Even a short EVA adds exposure during the alert.",
  ],
};
