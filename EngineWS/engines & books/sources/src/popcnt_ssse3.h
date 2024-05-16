#include <cstdint>
#include <tmmintrin.h>

static const __m128i popcount_mask = _mm_set1_epi8(0x0F);
static const __m128i popcount_table = _mm_setr_epi8(0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4);
static inline __m128i popcnt8(__m128i n) {
    const __m128i pcnt0 = _mm_shuffle_epi8(popcount_table, _mm_and_si128(n, popcount_mask));
    const __m128i pcnt1 = _mm_shuffle_epi8(popcount_table, _mm_and_si128(_mm_srli_epi16(n, 4), popcount_mask));
    return _mm_add_epi8(pcnt0, pcnt1);
}

static inline __m128i popcnt64(__m128i n) {
    const __m128i cnt8 = popcnt8(n);
    return _mm_sad_epu8(cnt8, _mm_setzero_si128());
}

static inline int popcnt_ssse3(uint64_t bb) {
    const __m128i n = _mm_set_epi64x(00, bb); //_mm_cvtsi64_si128(bb);
    const __m128i cnt64 = popcnt64(n);
    //const __m128i cnt64_hi = _mm_unpackhi_epi64(cnt64, cnt64);
    //const __m128i cnt128 = _mm_add_epi32(cnt64, cnt64_hi);
    //return _mm_cvtsi128_si32(cnt128);
    return _mm_cvtsi128_si32(cnt64);
}
