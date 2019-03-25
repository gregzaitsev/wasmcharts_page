#define MAX_WIDTH 2048
#define MAX_HEIGHT 800

class Bitmap {
    int width;
    int height;

    unsigned int data[MAX_WIDTH * MAX_HEIGHT];

public:

    Bitmap() : width(0), height(0) {}
    void init(int w, int h);

    void fillBackground(Color color);
    void clearBackground();

    int getWidth() { return width; }
    int getHeight() { return height; }
    void setPoint(int x, int y, BYTE a, Color &color);
    void mergePoint(int x, int y, BYTE a, Color &color);
    unsigned int *getData() { return data; }
};
