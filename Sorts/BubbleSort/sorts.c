#include "sorts.h"


void random(int *mass, int s){
        srand(time(nullptr));
        for (int i = 0; i < s; i++) {
                mass[i] = rand() % 100;
        }
}

void print(int *mass, int s){
        for(int i = 0; i < s; i++){

                std::cout << mass[i] << '\t';
        }
        std::cout << '\n';
}

void Swap(int *mass, int s){
        for (int i = 1; i< s; i++){
                 for (int j = i; j > 0 && mass[j-1]>mass[j]; j--){
                        swap(mass[j-1], mass[j]);

                        }

                }
}

