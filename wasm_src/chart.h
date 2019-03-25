#define MAX_SERIES 10
#define MAX_POINTS 1024
#define MAX_MARKS 20

class Chart {

  Bitmap mainBmp;
  Bitmap prevBmp;
  int theme;
  double visibleX1, visibleX2, visibleY1, visibleY2;     // Main visible rectangle
  double pvisibleX1, pvisibleX2, pvisibleY1, pvisibleY2; // Preview visible rectangle
  Point toDrawingCoordinatesMain(double x, double y);
  Point toDrawingCoordinatesPrev(double x, double y);

  Color seriesColors[MAX_SERIES];
  Color getBackgroundColor();
  Color getGraphColor(int l);

  // Data
  int seriesCount;
  double dataX[MAX_SERIES][MAX_POINTS];
  double dataY[MAX_SERIES][MAX_POINTS];
  int pointCount[MAX_SERIES];
  bool seriesEnabled[MAX_SERIES];
  double xMarks[MAX_MARKS];
  int xMarkCount;
  double yMarks[MAX_MARKS];
  int yMarkCount;

public:
  void init(int width, int mainHeight, int previewHeight);

  unsigned int *getMainBmp() { return mainBmp.getData(); }
  unsigned int *getPrevBmp() { return prevBmp.getData(); }

  // Rendering
  void setVisibleRect(double x1, double y1, double x2, double y2);
  void setVisibleRectPrev(double x1, double y1, double x2, double y2);
  void renderMain();
  void renderPrev();
  void setTheme(int t) { theme = t; }
  void setSeriesColor(int series, int r, int g, int b);
  double getCanvasX(double x);
  double getCanvasY(double y);

  // Data API
  void setSeriesCount(int seriesCount);
  void addDataPoint(int series, double x, double y);
  void toggleSeries(int series, bool enable);
  void addXMark(double m);
  void addYMark(double m);
  void removeXMark(double m);
  void removeYMark(double m);
  void resetMarks();

};
