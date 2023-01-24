#include <iostream>
#include <time.h>


void randomFill(int *bigAr, int size, int min, int max){
	srand(time(nullptr));
        for (int i = 0; i < size; i++){
		int num = rand()%100;
                if (num <= max && num >= min){
			bigAr[i] = num;
                }
                else{
			i = i - 1;
		}
        }
}


void printBigAr(int *bigAr, int size){
	for(int i = 0; i < size; i++){
		std::cout << bigAr[i] << "\t";
        }
	std::cout << "\n"; 
}


void countingSort(int *bigAr, int *smallAr,int size){
	for(int j = 0; j < size; j++){
		int num = bigAr[j];
		smallAr[num] = smallAr[num] + 1;
	}
}


void printSmallAr(int *smallAr){
	for(int i = 0; i < 100; i++){
		if(smallAr[i] <= 10){
			for(int k = 0; k < smallAr[i]; k ++){
				std::cout << i << " " << "\t";
			}
			std::cout << "\n";
		}
		else{
			for(int k = 0; k < 10; k ++){
				std::cout << i << " " << "\t";
			}
			std::cout << " - " << smallAr[i] - 10 << "\n";
		}

	}
}






int main(){
	int bigAr[10000];
	int smallAr[100];
	randomFill (bigAr, 10000, 0, 99);
	printBigAr (bigAr, 10000);
	std::cout << std::endl;
	countingSort(bigAr, smallAr, 10000);
	printSmallAr(smallAr);
	return 0;
}










