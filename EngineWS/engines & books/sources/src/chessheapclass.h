#include <cstdio>
#include <cstdlib>
#include <cstring>


class ChessHeapClass {
    static constexpr int bucket_size_mb = 512;
    static constexpr int max_memory_mb = 4096;
    static constexpr int num_per_bucket = bucket_size_mb * 1024 * 1024 / sizeof(ENTRY);
    static constexpr int arrays_size = max_memory_mb / bucket_size_mb;

    static_assert(sizeof(ENTRY) == 16, "ENTRY size must be 16 bytes.");

    int    bucket_sizs[arrays_size];
    ENTRY *bucket_ptrs[arrays_size];

    unsigned int tt_size;
    unsigned int tt_mask;

    bool success;

    void Free() {           // free the allocated memory and zeroize bucket_ptrs[]

        for (int i = 0; i < arrays_size && bucket_ptrs[i]; i++) {
            free(bucket_ptrs[i]);
            bucket_ptrs[i] = NULL;
        }
    }

    void ZeroMem() {        // zeroize the allocated memory

        if (success)
            for (int i = 0; i < arrays_size && bucket_ptrs[i]; i++)
                memset(bucket_ptrs[i], 0, 1024 * 1024 * bucket_sizs[i]);
    }

    ENTRY *MakeAddr(int entry_number) const {     // calculate address of the entry with entry_number

        const int num_of_bucket = entry_number / num_per_bucket;

        return bucket_ptrs[num_of_bucket] + entry_number - num_per_bucket * num_of_bucket;
    }

    bool Alloc(int size_mb) {       // allocate size_mb megabyte of memory and return true on success

        if (size_mb > max_memory_mb)
            return false;

        Free();

        success = true;
        for (int i = 0; size_mb > 0 && success; i++) {
            bucket_sizs[i] = size_mb > bucket_size_mb ? bucket_size_mb : size_mb;
            bucket_ptrs[i] = (ENTRY *) malloc(1024 * 1024 * bucket_sizs[i]);
            success = bucket_ptrs[i] != NULL;
            size_mb -= bucket_size_mb;

            if (success)
                printf_debug("allocated: %dMB\n", bucket_sizs[i]);
        }

        if (!success)
            Free();

        return success;
    }

  public:

    int tt_date;

    ChessHeapClass(): bucket_ptrs{}, success{false} {};

    ~ChessHeapClass() {

        Free();
    }

    void AllocTrans(unsigned int mbsize);
    void Clear();
    bool Retrieve(U64 key, int *move, int *score, int *flag, int alpha, int beta, int depth, int ply);
    void RetrieveMove(U64 key, int *move);
    void Store(U64 key, int move, int score, int flags, int depth, int ply);
};
