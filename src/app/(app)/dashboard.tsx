import React, { useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Platform,
    useWindowDimensions,
    Image,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Header } from '@/components/header';
import { PokeballLoading } from '@/components/pokeball-loading';
import { getTeam, updateTeam } from '@/integration/teamIntegration';
import { useAuth } from '@/context/AuthContext';
import { Pokemon, Poder } from '@/@types/pokemon';
import { getColor, Colors } from '@/constants/colors';
import { TYPE_MAP, TYPE_ICONS, STAT_ABBR } from '@/constants/pokemon';

const mapType = (t: string) => TYPE_MAP[t] ?? 'normal';

const isWeb = Platform.OS === 'web';

const COLS = 2;
const CARD_GAP = 10;
const GRID_H_PAD = 16;

const MY_TEAM_CARD_WIDTH = 130;
const MY_TEAM_CARD_HEIGHT = 118;

const STORAGE_KEY = "captured_pokemons";

export default function Dashboard() {
    const { width } = useWindowDimensions();
    const { user, userId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [myTeam, setMyTeam] = useState<Pokemon[]>([]);
    const [myPokemons, setMyPokemons] = useState<Pokemon[]>([]);

    const [selectedCaptured, setSelectedCaptured] = useState<Pokemon | null>(null);
    const [selectedTeamIdx, setSelectedTeamIdx] = useState<number | null>(null);
    const [rolling, setRolling] = useState(false);
    const [roulettePokemon, setRoulettePokemon] = useState<Pokemon | null>(null);
    const [rouletteName, setRouletteName] = useState("?");
    const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);
    

    const cardWidth = Math.floor((width - GRID_H_PAD * 2 - CARD_GAP * (COLS - 1)) / COLS);

    useEffect(() => {
        async function load() {
            try {
                if (!userId) return;
               const { team, capture } = await getTeam(userId);

            setMyTeam(team);

            const saved = await AsyncStorage.getItem(STORAGE_KEY);

            if (saved) {

                const localPokemons: Pokemon[] = JSON.parse(saved);

                // junta os da API com os salvos
                const merged = [...capture];

                localPokemons.forEach(p => {

                    if (!merged.find(x => x.index === p.index)) {
                        merged.push(p);
                    }

                });

                setMyPokemons(merged);

            } else {

                setMyPokemons(capture);

            }
            } catch (e) {
                console.error('Erro ao carregar pokémons:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [userId]);

    useEffect(() => {
    return () => {
        if (animationRef.current) {
            clearInterval(animationRef.current);
        }
    };
}, []);

    const clearSelection = useCallback(() => {
        setSelectedCaptured(null);
        setSelectedTeamIdx(null);
    }, []);

    const callUpdateTeam = useCallback(async (
        newTeam: Pokemon[] | null,
        removedPokemon?: string,
        newPokemon?: string
    ) => {
        if (!userId) return;
        setSaving(true);
        try {
            await updateTeam(
                userId,
                newTeam ? newTeam.map(p => p.index) : null,
                removedPokemon,
                newPokemon
            );
        } catch (e) {
            console.error('Erro ao salvar time:', e);
        } finally {
            setSaving(false);
        }
    }, []);

    const spinRoulette = async () => {
    if (rolling) return;

    setRolling(true);
    setRoulettePokemon(null);

    animationRef.current = setInterval(() => {
        const random = Math.floor(Math.random() * 1025) + 1;
        setRouletteName(`#${random}`);
    }, 80);

    try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        let pokemon;

        while (true) {
            const randomId = Math.floor(Math.random() * 1025) + 1;
            const response = await fetch(
                `https://pokeapi.co/api/v2/pokemon/${randomId}`
            );

            const data = await response.json();
            const exists = myPokemons.some(
                p => Number(p.index) === data.id
            );

            if (exists) continue;

            pokemon = {
                index: String(data.id),
                nome:
                    data.name.charAt(0).toUpperCase() +
                    data.name.slice(1),

                imagem:
                    data.sprites.other["official-artwork"].front_default ??
                    data.sprites.front_default,

                tipos: data.types.map(
                    (t: any) => t.type.name
                ),

                poderes: data.stats.map((s: any) => ({
                    nome: s.stat.name,
                    forca: s.base_stat,
                })),
            };
            break;
        }

        if (animationRef.current) {
            clearInterval(animationRef.current);
        }

        setRouletteName(pokemon.nome);
        setRoulettePokemon(pokemon);

        // adiciona à coleção
        setMyPokemons(prev => [...prev, pokemon]);

    } catch (err) {
        console.log(err);
    }

    setRolling(false);
};

    const handleTeamCardPress = useCallback((pokemon: Pokemon, index: number) => {
        // If a captured pokemon is selected → replace this team slot
        if (selectedCaptured) {
            const newTeam = [...myTeam];
            const displaced = newTeam[index];
            newTeam[index] = selectedCaptured;
            setMyTeam(newTeam);
            setMyPokemons(prev => [
                ...prev.filter(p => p.index !== selectedCaptured.index),
                displaced,
            ]);
            clearSelection();
            callUpdateTeam(null, displaced.index, selectedCaptured.index);
            return;
        }

        // If another team slot is already selected → swap positions
        if (selectedTeamIdx !== null && selectedTeamIdx !== index) {
            const newTeam = [...myTeam];
            [newTeam[selectedTeamIdx], newTeam[index]] = [newTeam[index], newTeam[selectedTeamIdx]];
            setMyTeam(newTeam);
            clearSelection();
            callUpdateTeam(newTeam);
            return;
        }

        // Toggle selection for reorder
        if (selectedTeamIdx === index) {
            setSelectedTeamIdx(null);
        } else {
            setSelectedTeamIdx(index);
            setSelectedCaptured(null);
        }
    }, [selectedCaptured, selectedTeamIdx, myTeam, clearSelection, callUpdateTeam]);

    const handleCapturedCardPress = useCallback((pokemon: Pokemon) => {
        // Toggle selection
        if (selectedCaptured?.index === pokemon.index) {
            setSelectedCaptured(null);
        } else {
            setSelectedCaptured(pokemon);
            setSelectedTeamIdx(null);
        }
    }, [selectedCaptured]);

    const renderMyTeamCard = (pokemon: Pokemon, index: number) => {
        const ptTypes = pokemon.tipos.map(mapType);
        const colors = getColor(ptTypes);
        const hp = pokemon.poderes.find(p => p.nome === 'hp')?.forca ?? 0;

        const isSelectedForReorder = selectedTeamIdx === index;
        const isTargetForSwap = selectedCaptured !== null;

        const borderColor = isSelectedForReorder
            ? Colors.btnPrimary
            : isTargetForSwap
                ? Colors.game.win
                : colors.accent;

        return (
            <TouchableOpacity
                key={pokemon.index}
                activeOpacity={0.75}
                onPress={() => handleTeamCardPress(pokemon, index)}
                style={[
                    styles.myTeamCard,
                    { borderColor, shadowColor: borderColor },
                    isSelectedForReorder && styles.selectedCard,
                    isTargetForSwap && styles.swapTargetCard,
                ]}
            >
                {isSelectedForReorder && (
                    <View style={styles.selectionBadge}>
                        <Text style={styles.selectionBadgeText}>↕</Text>
                    </View>
                )}
                {isTargetForSwap && (
                    <View style={[styles.selectionBadge, styles.swapBadge]}>
                        <Text style={styles.selectionBadgeText}>⇄</Text>
                    </View>
                )}
                <View style={[styles.shimmerStrip, { backgroundColor: colors.accent + '18' }]} />
                <View style={[styles.innerCard, { backgroundColor: colors.bg }]}>
                    <View style={[styles.topBar, { backgroundColor: colors.accent + '22', borderBottomColor: colors.accent + '55' }]}>
                        <Text style={[styles.pokeName, { color: Colors.white }]} numberOfLines={1}>
                            {pokemon.nome}
                        </Text>
                        <View style={styles.hpRow}>
                            <Text style={styles.hpLabel}>HP</Text>
                            <Text style={[styles.hpValue, { color: colors.accent }]}>{hp}</Text>
                        </View>
                    </View>
                    <View style={[
                        styles.imageWrapper,
                        styles.myTeamImageWrapper,
                        { borderColor: colors.accent + '33', backgroundColor: colors.accent + '0A' },
                    ]}>
                        <View style={[styles.cornerTL, { borderColor: colors.accent + '55' }]} />
                        <View style={[styles.cornerBR, { borderColor: colors.accent + '55' }]} />
                        <Image
                            source={{ uri: pokemon.imagem }}
                            style={styles.myTeamImage}
                            resizeMode="contain"
                        />
                    </View>
                </View>
                <View style={[styles.glowRing, { borderColor: borderColor + '33' }]} />
            </TouchableOpacity>
        );
    };

    const renderGridCard = (pokemon: Pokemon) => {
        const ptTypes = pokemon.tipos.map(mapType);
        const colors = getColor(ptTypes);
        const hp = pokemon.poderes.find(p => p.nome === 'hp')?.forca ?? 0;
        const isSelected = selectedCaptured?.index === pokemon.index;

        return (
            <TouchableOpacity
                key={pokemon.index}
                activeOpacity={0.75}
                onPress={() => handleCapturedCardPress(pokemon)}
                style={[
                    styles.outerFrame,
                    { width: cardWidth, borderColor: isSelected ? Colors.btnPrimary : colors.accent, shadowColor: colors.accent },
                    isSelected && styles.selectedCard,
                ]}
            >
                {isSelected && (
                    <View style={styles.selectionBadge}>
                        <Text style={styles.selectionBadgeText}>✓</Text>
                    </View>
                )}
                <View style={[styles.shimmerStrip, { backgroundColor: colors.accent + '18' }]} />

                <View style={[styles.innerCardStatic, { backgroundColor: colors.bg }]}>
                    <View style={[styles.topBar, { backgroundColor: colors.accent + '22', borderBottomColor: colors.accent + '55' }]}>
                        <Text style={[styles.pokeName, { color: Colors.white }]} numberOfLines={1}>
                            {pokemon.nome}
                        </Text>
                        <View style={styles.hpRow}>
                            <Text style={styles.hpLabel}>HP</Text>
                            <Text style={[styles.hpValue, { color: colors.accent }]}>{hp}</Text>
                        </View>
                    </View>

                    <View style={[
                        styles.imageWrapper,
                        { borderColor: colors.accent + '33', backgroundColor: colors.accent + '0A' },
                    ]}>
                        <View style={[styles.cornerTL, { borderColor: colors.accent + '55' }]} />
                        <View style={[styles.cornerBR, { borderColor: colors.accent + '55' }]} />
                        <Image
                            source={{ uri: pokemon.imagem }}
                            style={styles.pokemonImage}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={[styles.footerRow, { borderTopColor: colors.accent + '33' }]}>
                        <View style={styles.typesRow}>
                            {ptTypes.map(t => (
                                <View key={t} style={[styles.typePill, { backgroundColor: colors.accent + '25', borderColor: colors.accent + '55' }]}>
                                    <Text style={styles.typeEmoji}>{TYPE_ICONS[t] ?? '⭐'}</Text>
                                    <Text style={[styles.typeLabel, { color: colors.accent }]}>{t}</Text>
                                </View>
                            ))}
                        </View>
                        <Text style={[styles.indexNumber, { color: colors.accent + 'BB' }]}>#{pokemon.index}</Text>
                    </View>

                    <View style={[styles.statsSection, { borderTopColor: colors.accent + '22' }]}>
                        {pokemon.poderes.map((poder: Poder) => (
                            <View key={poder.nome} style={styles.statRow}>
                                <Text style={styles.statName}>
                                    {STAT_ABBR[poder.nome] ?? poder.nome.slice(0, 4).toUpperCase()}
                                </Text>
                                <View style={styles.statBarBg}>
                                    <View style={[styles.statBarFill, {
                                        width: `${Math.min((poder.forca / 150) * 100, 100)}%` as any,
                                        backgroundColor: colors.accent,
                                    }]} />
                                </View>
                                <Text style={[styles.statValue, { color: colors.accent }]}>{poder.forca}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={[styles.glowRing, { borderColor: colors.accent + '22' }]} />
            </TouchableOpacity>
        );
    };

    const hasSelection = selectedCaptured !== null || selectedTeamIdx !== null;

    return (
        <View style={styles.wrapper}>
            <Header showGreeting />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>

                <View style={styles.sectionHeader}>
                    <View style={styles.sectionAccent} />
                    <Text style={styles.sectionTitle}>MEU TIME</Text>
                    {!loading && <Text style={styles.sectionSub}>{myTeam.length} selecionados</Text>}
                    {saving && <ActivityIndicator size="small" color={Colors.btnPrimary} style={styles.savingIndicator} />}
                </View>

                {hasSelection && (
                    <View style={styles.hintBar}>
                        <Text style={styles.hintText}>
                            {selectedCaptured
                                ? `Toque em um slot do time para substituir por ${selectedCaptured.nome}`
                                : 'Toque em outro Pokémon do time para trocar a posição'}
                        </Text>
                        <TouchableOpacity onPress={clearSelection} style={styles.hintCancel}>
                            <Text style={styles.hintCancelText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!loading && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.selectedList}
                        decelerationRate="fast"
                        snapToInterval={MY_TEAM_CARD_WIDTH + CARD_GAP}
                        snapToAlignment="start"
                    >
                        {myTeam.map((pokemon, index) => renderMyTeamCard(pokemon, index))}
                        <View style={styles.horizontalEnd} />
                    </ScrollView>
                )}


                <View style={styles.rouletteContainer}>

                    <Text style={styles.rouletteTitle}>
                        🎰 ROLETA POKÉMON
                    </Text>

                    <View style={styles.rouletteCard}>

                        {roulettePokemon ? (
                            <>
                                <Image
                                    source={{ uri: roulettePokemon.imagem }}
                                    style={styles.rouletteImage}
                                    resizeMode="contain"
                                />

                                <Text style={styles.rouletteName}>
                                    {roulettePokemon.nome}
                                </Text>

                                <Text style={styles.rouletteId}>
                                    #{roulettePokemon.index}
                                </Text>
                            </>
                        ) : (
                            <>
                                <View style={styles.questionCircle}>
                                    <Text style={styles.questionText}>
                                        {rolling ? rouletteName : "?"}
                                    </Text>
                                </View>

                                <Text style={styles.rouletteName}>
                                    {rolling
                                        ? "Procurando Pokémon..."
                                        : "Clique para girar"}
                                </Text>
                            </>
                        )}

                        <TouchableOpacity
                            disabled={rolling}
                            onPress={spinRoulette}
                            style={[
                                styles.spinButton,
                                rolling && {
                                    opacity: 0.6
                                }
                            ]}
                        >
                            <Text style={styles.spinButtonText}>
                                {rolling
                                    ? "Girando..."
                                    : "🎲 GIRAR ROLETA"}
                            </Text>
                        </TouchableOpacity>

                    </View>

                </View>

                <View style={[styles.sectionHeader, styles.sectionHeaderList]}>
                    <View style={styles.sectionAccent} />
                    <Text style={styles.sectionTitle}>MEUS POKÉMONS</Text>
                    {!loading && <Text style={styles.sectionSub}>{myPokemons.length} capturados</Text>}
                </View>

                {loading ? (
                    <PokeballLoading />
                ) : (
                    <View style={[styles.grid, { paddingHorizontal: GRID_H_PAD, gap: CARD_GAP }]}>
                        {myPokemons.map(pokemon => renderGridCard(pokemon))}
                    </View>
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        marginBottom: 12,
        marginTop: 20,
    },
    sectionHeaderList: {
        marginTop: 28,
    },
    sectionAccent: {
        width: 3,
        height: 16,
        borderRadius: 2,
        backgroundColor: Colors.btnPrimary,
    },
    sectionTitle: {
        color: Colors.teste,
        fontSize: isWeb ? 13 : 11,
        fontWeight: '900',
        letterSpacing: 3,
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
    },
    sectionSub: {
        color: Colors.whiteAlpha['30'],
        fontSize: isWeb ? 11 : 10,
        fontWeight: '600',
        letterSpacing: 1,
        marginLeft: 'auto',
    },
    savingIndicator: {
        marginLeft: 8,
    },

    /* Hint bar */
    hintBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 10,
        backgroundColor: Colors.surfaceCard,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.primaryAlpha['25'],
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    hintText: {
        flex: 1,
        color: Colors.whiteAlpha['65'],
        fontSize: isWeb ? 11 : 10,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    hintCancel: {
        width: 22,
        height: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 11,
    },
    hintCancelText: {
        color: Colors.whiteAlpha['55'],
        fontSize: 11,
        fontWeight: '800',
    },

    /* Selection states */
    selectedCard: {
        borderWidth: 3,
        ...(Platform.OS !== 'web'
            ? { shadowOpacity: 0.9, shadowRadius: 16 }
            : {} as any),
    },
    swapTargetCard: {
        borderWidth: 2,
        borderColor: Colors.game.win,
    },
    selectionBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        zIndex: 10,
        backgroundColor: Colors.btnPrimary,
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    swapBadge: {
        backgroundColor: Colors.game.win,
    },
    selectionBadgeText: {
        color: Colors.white,
        fontSize: 11,
        fontWeight: '900',
    },

    /* Meu Time */
    selectedList: {
        paddingHorizontal: GRID_H_PAD,
        paddingBottom: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
    },
    horizontalEnd: {
        width: 10,
    },

    /* Grid */
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },

    /* Meu Time card */
    myTeamCard: {
        width: MY_TEAM_CARD_WIDTH,
        height: MY_TEAM_CARD_HEIGHT,
        borderRadius: 14,
        borderWidth: 2,
        overflow: 'hidden',
        marginRight: CARD_GAP,
        ...(Platform.OS !== 'web'
            ? { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 }
            : { boxShadow: '0 4px 20px rgba(0,0,0,0.6)' } as any),
    },
    myTeamImageWrapper: {
        height: 68,
        marginVertical: 4,
    },
    myTeamImage: {
        width: 60,
        height: 60,
    },

    outerFrame: {
        borderRadius: 14,
        borderWidth: 4,
        overflow: 'hidden',
        marginBottom: CARD_GAP,
        ...(Platform.OS !== 'web'
            ? { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 }
            : { boxShadow: '0 4px 20px rgba(0,0,0,0.6)' } as any),
    },

    shimmerStrip: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        zIndex: 0,
    },

    innerCard: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },

    innerCardStatic: {
        borderRadius: 12,
        overflow: 'hidden',
    },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderBottomWidth: 1,
    },

    pokeName: {
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.3,
        flex: 1,
        textTransform: 'capitalize',
    },

    hpRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },

    hpLabel: {
        color: Colors.whiteAlpha['10'],
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1,
    },

    hpValue: {
        fontSize: 16,
        fontWeight: '900',
    },

    imageWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        height: isWeb ? 120 : 80,
        marginHorizontal: 8,
        marginVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        overflow: 'hidden',
    },

    cornerTL: {
        position: 'absolute',
        top: 4,
        left: 4,
        width: 12,
        height: 12,
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderRadius: 2,
    },

    cornerBR: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 12,
        height: 12,
        borderBottomWidth: 2,
        borderRightWidth: 2,
        borderRadius: 2,
    },

    pokemonImage: {
        width: isWeb ? 100 : 72,
        height: isWeb ? 100 : 72,
    },

    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderTopWidth: 1,
    },

    typesRow: {
        flexDirection: 'row',
        gap: 4,
        flex: 1,
        flexWrap: 'wrap',
    },

    typePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 20,
        borderWidth: 1,
    },

    typeEmoji: {
        fontSize: 9,
    },

    typeLabel: {
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },

    indexNumber: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    statsSection: {
        borderTopWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 6,
        gap: 4,
    },

    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    statName: {
        color: Colors.whiteAlpha['35'],
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
        width: 35,
    },

    statBarBg: {
        flex: 1,
        height: 10,
        backgroundColor: Colors.whiteAlpha['08'],
        borderRadius: 2,
        overflow: 'hidden',
    },

    statBarFill: {
        height: '100%',
        borderRadius: 2,
        opacity: 0.85,
    },
    statValue: {
        fontSize: 8,
        fontWeight: '700',
        width: 22,
        textAlign: 'right',
    },

    glowRing: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: 16,
        borderWidth: 1,
        pointerEvents: 'none' as any,
    },

/* ================= ROLETA ================= */

rouletteContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
},

rouletteTitle: {
    color: Colors.teste,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: "center",
},

rouletteCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.btnPrimary,

    ...(Platform.OS !== "web"
        ? {
            shadowColor: Colors.btnPrimary,
            shadowOpacity: 0.35,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 10,
        }
        : {
            boxShadow: "0 0 18px rgba(0,255,255,.35)",
        } as any),
},

    questionCircle: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: Colors.background,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
        borderWidth: 3,
        borderColor: Colors.btnPrimary,
    },

    questionText: {
        fontSize: 32,
        color: Colors.btnPrimary,
        fontWeight: "900",
    },

    rouletteImage: {
        width: 160,
        height: 160,
        marginBottom: 10,
    },

    rouletteName: {
        color: Colors.white,
        fontSize: 22,
        fontWeight: "900",
        textTransform: "capitalize",
        marginBottom: 5,
    },

    rouletteId: {
        color: Colors.btnPrimary,
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 18,
    },

    spinButton: {
        backgroundColor: Colors.btnPrimary,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 50,
        marginTop: 10,
    },

    spinButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "900",
        letterSpacing: 1,
    },

    bottomSpacer: {
        height: 16,
    },
});
